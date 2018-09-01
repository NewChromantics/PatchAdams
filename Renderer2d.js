
var FragShader_Hub = `
precision highp float;
varying vec2 uv;
uniform sampler2D SdfTexture;
const vec3 Colour = vec3(19.0/255.0,69.0/255.0,150.0/255.0);
const vec3 MetalColour = vec3(0.7,0.7,0.7);
const vec3 HoleColour = vec3(0,0,0);
const vec3 Led0Colour = vec3(0,1,0);
const vec3 Led1Colour = vec3(1,1,0);
const vec3 LedOffColour = vec3(0.1,0.3,0.1);
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

vec4 DrawPlug(vec2 uv,bool Led0Status,bool Led1Status)
{
	vec4 SdfChannels = texture2D( SdfTexture, uv);
	float Alpha = SdfChannels.w;
	bool Metal = SdfChannels.r>0.5;
	bool Led0 = SdfChannels.g>0.5;
	bool Led1 = SdfChannels.b>0.5;
	if ( Metal )	return vec4( MetalColour, Alpha );
	if ( Led0 )		return vec4( Led0Status ? Led0Colour : LedOffColour, Alpha );
	if ( Led1 )		return vec4( Led1Status ? Led1Colour : LedOffColour, Alpha );
	return vec4( HoleColour, Alpha );
}

void main()
{
	gl_FragColor = vec4(Colour,1);
	
	float PlugIndex = uv.x * float(PlugCount);
	
	vec2 Pluguv = vec2( fract(PlugIndex), uv.y );
	
	//int Ledu = StackIndex*StackWidth+int(PlugIndex);
	//vec2 LedUv = vec2( float(Ledu)/float(DataWidth));
	//vec4 Led0123 = texture2D(Data,LedUv);
	//bool Led0 = Led0123.x > 0.5;
	//bool Led1 = Led0123.y > 0.5;
	bool Led0 = true;
	bool Led1 = true;
	vec4 PlugColour = DrawPlug(Pluguv,Led0,Led1);
	gl_FragColor.xyz = mix(gl_FragColor.xyz,PlugColour.xyz,PlugColour.w);
}
`;



function TRenderer2d(Context)
{
	this.HubShader = new TShader("Sdf", PopGlBlitter.VertShader, FragShader_Hub );
	PopGlBlitter.Init(Context);
	
	//let SdfUrl = 'plug.png';
	//let SdfUrl = 'http://electric.horse/horse_sdf.png';
	let SdfUrl = 'https://raw.githubusercontent.com/NewChromantics/PatchAdams/master/Plug.png';
	let LinearFilter = false;
	this.PlugSdfTexture = new TTexture("sdf",SdfUrl,null,LinearFilter);
	
	
	this.DrawScene = function(Game,RenderTarget)
	{
		RenderTarget.Bind();
		Game.Hubs.forEach( this.DrawHub, this );
	}
	
	this.DrawHub = function(Hub)
	{
		let Rect = Hub.GetBox3().GetFrontFaceRect();
		let Scale = 1;
		let Rect4 = new float4( Rect[0]*Scale, Rect[1]*Scale, Rect[2]*Scale, Rect[3]*Scale );
		let SdfTexture = this.PlugSdfTexture;
		//console.log(Rect4);
		let SetUniforms = function(Shader,Geo)
		{
			Shader.SetUniform( 'PlugCount', Hub.Plugs.length );
			Shader.SetUniform( 'VertexRect', Rect4 );
			Shader.SetUniform( 'SdfTexture', SdfTexture );
		}
		RenderGeo( this.HubShader, PopGlBlitter.BlitGeometry, SetUniforms );
	}
}

