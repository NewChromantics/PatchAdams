
var FragShader_Hub = `
precision highp float;
varying vec2 uv;
uniform sampler2D PlugSdfTexture;
uniform sampler2D PlugBlurSdfTexture;
const vec3 Colour = vec3(19.0/255.0,69.0/255.0,150.0/255.0);
const vec3 MetalColour = vec3(0.8,0.8,0.9);
const vec3 HoleColour = vec3(0,0,0);
const vec3 LedOffColour = vec3(0.1,0.3,0.1);
const vec3 LedRedColour = vec3(1.0,0.0,0.1);
const vec3 LedYellowColour = vec3(1.0,1.0,0.0);
const vec3 LedGreenColour = vec3(0.0,1.0,0.0);

uniform sampler2D DataTexture;
uniform vec2 DataTextureSize;
uniform int HubIndex;
uniform int PlugCount;

float Range(float Min,float Max,float Value)
{
	return (Value-Min)/(Max-Min);
}
bool InsideRect(vec4 Rect,vec2 uv)
{
	uv.x = Range(Rect.x,Rect.z,uv.x);
	uv.y = Range(Rect.y,Rect.w,uv.y);
	return uv.x>=0.0 && uv.x<=1.0 && uv.y>=0.0 && uv.y<=1.0;
}

vec3 GetLedColour(float LedState)
{
	if ( LedState < 0.33 )
	{
		LedState = Range(0.00,0.33,LedState);
		return mix( LedOffColour, LedRedColour, LedState );
	}
	if ( LedState < 0.66 )
	{
		LedState = Range(0.33,0.66,LedState);
		//return vec3( 1, LedState, 0 );
		return mix( LedRedColour, LedYellowColour, LedState );
	}
	//if ( LedState < 0.75 )
	{
		LedState = Range(0.66,1.00,LedState);
		//return vec3( 1.0-LedState, 1.0, 0 );
		return mix( LedYellowColour, LedGreenColour, LedState );
	}
}

vec4 DrawPlug(vec2 uv,float Led0Status,float Led1Status)
{
	vec4 SdfChannels = texture2D( PlugSdfTexture, uv);
	float Alpha = SdfChannels.w;
	bool Metal = SdfChannels.r>0.5;
	bool Led0 = SdfChannels.g>0.5;
	bool Led1 = SdfChannels.b>0.5;
	if ( Metal )	return vec4( MetalColour, Alpha );
	if ( Led0 )		return vec4( GetLedColour(Led0Status), Alpha );
	if ( Led1 )		return vec4( GetLedColour(Led1Status), Alpha );
	return vec4( HoleColour, Alpha );
}

void main()
{
	gl_FragColor = vec4(Colour,1);
	
	float PlugIndexf = uv.x * float(PlugCount);
	
	vec2 Pluguv = vec2( fract(PlugIndexf), uv.y );
	int PlugIndex = int(PlugIndexf);
	vec2 Datauv = vec2( float(PlugIndex) / DataTextureSize.x, float(HubIndex) / DataTextureSize.y );
	Datauv += vec2( 0.5,0.5 ) / DataTextureSize;	//	read from middle of texel
	vec4 Data4 = texture2D(DataTexture,Datauv);
	
	//int Ledu = StackIndex*StackWidth+int(PlugIndex);
	//vec2 LedUv = vec2( float(Ledu)/float(DataWidth));
	//vec4 Led0123 = texture2D(Data,LedUv);
	//bool Led0 = Led0123.x > 0.5;
	//bool Led1 = Led0123.y > 0.5;
	float Led0 = Data4.x;
	float Led1 = Data4.y;
	vec4 PlugColour = DrawPlug(Pluguv,Led0,Led1);
	gl_FragColor.xyz = mix(gl_FragColor.xyz,PlugColour.xyz,PlugColour.w);
}
`;



function TRenderer2d(Canvas,OnInput)
{
	this.UpdateDataTexture = function(Game)
	{
		//	setup data
		let HubCount = Game.Hubs.length;
		let PlugCount = Game.Hubs[0].Plugs.length;
		let Data = new Array(HubCount * PlugCount * 4);
		let SetData = function(HubIndex,PlugIndex,a,b,c,d)
		{
			let Index = PlugIndex + (HubIndex * PlugCount);
			Index *= 4;
			Data[Index+0] = a * 255;
			Data[Index+1] = b * 255;
			Data[Index+2] = c * 255;
			Data[Index+3] = d * 255;
		}
		let SetPlugData = function(Plug,PlugIndex,HubIndex)
		{
			let Data0 = Plug.GetLed0();
			let Data1 = Plug.GetLed1();
			SetData( HubIndex, PlugIndex, Data0, Data1, 0, 0, 1 );
		}
		let SetHubData = function(Hub,HubIndex)
		{
			Hub.Plugs.forEach( function(p,pi)	{	SetPlugData(p,pi,HubIndex);	} );
		}
		Game.Hubs.forEach(SetHubData);
		this.DataTexture.WritePixels( PlugCount, HubCount, new Uint8Array(Data), false );
	}
	
	this.DrawScene = function(Game,RenderTarget)
	{
		let ClearColour = new float4(0,1,1,1);
		Context.Clear(ClearColour);
		
		this.UpdateDataTexture(Game);
		RenderTarget.Bind();
		Game.Hubs.forEach( this.DrawHub, this );
	}
	
	this.DrawHub = function(Hub,HubIndex)
	{
		let Rect = Hub.GetBox3().GetFrontFaceRect();
		let Scale = 1;
		let Rect4 = new float4( Rect[0]*Scale, Rect[1]*Scale, Rect[2]*Scale, Rect[3]*Scale );
		let PlugSdfTexture = this.PlugSdfTexture;
		let PlugBlurSdfTexture = this.PlugBlurSdfTexture;
		let DataTexture = this.DataTexture;
		//console.log(Rect4);
		let SetUniforms = function(Shader,Geo)
		{
			Shader.SetUniform( 'PlugCount', Hub.Plugs.length );
			Shader.SetUniform( 'VertexRect', Rect4 );
			Shader.SetUniform( 'PlugSdfTexture', PlugSdfTexture );
			Shader.SetUniform( 'PlugBlurSdfTexture', PlugBlurSdfTexture );
			Shader.SetUniform( 'DataTexture', DataTexture );
			Shader.SetUniform( 'DataTextureSize', new float2(DataTexture.GetWidth(),DataTexture.GetHeight()) );
			Shader.SetUniform( 'HubIndex', HubIndex );
		}
		RenderGeo( this.HubShader, PopGlBlitter.BlitGeometry, SetUniforms );
	}
	
	this.OnMouseOver = function(Event)
	{
		let Pos = [Event.clientX,Event.clientY];
		Pos[0] /= Event.target.clientWidth;
		Pos[1] /= Event.target.clientHeight;
		let Down = Event.buttons & 1;
		OnInput( Down, Pos );
	}
	
	this.SetupInputEvents = function(Element)
	{
		Element.addEventListener('mousdown', this.OnMouseOver.bind(this) );
		Element.addEventListener('mouseup', this.OnMouseOver.bind(this) );
		Element.addEventListener('mousemove', this.OnMouseOver.bind(this) );
	}
	
	let Context = new TContext( Canvas );
	this.HubShader = new TShader("Sdf", PopGlBlitter.VertShader, FragShader_Hub );
	PopGlBlitter.Init(Context);
	
	//let SdfUrl = 'plug.png';
	//let SdfUrl = 'http://electric.horse/horse_sdf.png';
	let SdfUrl = 'https://raw.githubusercontent.com/NewChromantics/PatchAdams/master/Plug.png';
	this.PlugSdfTexture = new TTexture("sdf",SdfUrl,null,false);
	this.PlugBlurSdfTexture = new TTexture("sdf",SdfUrl,null,true);
	this.DataTexture = new TTexture("Data");
	this.SetupInputEvents( Canvas );
}

