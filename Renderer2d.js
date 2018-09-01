
var FragShader_SdfHorse = `
precision highp float;
varying vec2 uv;
uniform sampler2D SdfTexture;
uniform vec4 Colour;
const vec4 Led0Colour = vec4(0,1,0,1);
const vec4 Led1Colour = vec4(1,1,0,1);
const vec4 LedOffColour = vec4(0.1,0.3,0.1,1);
const int DataWidth = 8*8;
uniform int StackIndex;
const int StackWidth = 8;


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

vec4 DrawPlug(vec2 uv,bool Led0,bool Led1)
{
	vec4 Led0Rect = vec4(0.1,0.2,0.3,0.4);
	vec4 Led1Rect = vec4(0.7,0.2,0.9,0.4);
	vec4 HoleRect = vec4(0.2,0.3,0.8,0.8);
	vec4 EdgeRect = vec4(0.1,0.2,0.9,0.9);
	if ( InsideRect(Led0Rect,uv) )  return Led0 ? Led0Colour : LedOffColour;
	if ( InsideRect(Led1Rect,uv) )  return Led1 ? Led1Colour : LedOffColour;
	if ( InsideRect(HoleRect,uv) )  return vec4(0,0,0,1);
	if ( InsideRect(EdgeRect,uv) )  return vec4(0.7,0.7,0.7,1);
	return vec4(uv,0,0);
}

void main()
{
	gl_FragColor.xyzw = vec4( uv, 0, 1 );
	return;
	float Plugs=10.0;
	float PlugIndex = uv.x*10.0;
	float PlugU = fract(PlugIndex);
	gl_FragColor = vec4(Colour.xyz,1);
	
	//int Ledu = StackIndex*StackWidth+int(PlugIndex);
	//vec2 LedUv = vec2( float(Ledu)/float(DataWidth));
	//vec4 Led0123 = texture2D(Data,LedUv);
	//bool Led0 = Led0123.x > 0.5;
	//bool Led1 = Led0123.y > 0.5;
	bool Led0 = true;
	bool Led1 = true;
	vec4 PlugColour = DrawPlug(vec2(PlugU,uv.y),Led0,Led1);
	gl_FragColor.xyz = mix(gl_FragColor.xyz,PlugColour.xyz,PlugColour.w);
	
}
`;



function TRenderer2d()
{
	this.HubShader = new TShader("Sdf", PopGlBlitter.VertShader, FragShader_SdfHorse );
	PopGlBlitter.Init();
	
	//let SdfUrl = 'plug.png';
	let SdfUrl = 'http://electric.horse/horse_sdf.png';
	this.PlugSdfTexture = new TTexture("sdf",SdfUrl);
	
	
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
			Shader.SetUniform( 'VertexRect', Rect4 );
			Shader.SetUniform( 'SdfTexture', SdfTexture );
		}
		RenderGeo( this.HubShader, PopGlBlitter.BlitGeometry, SetUniforms );
	}
}

