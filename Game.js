const HubWidth = 0.6;
const HubDepth = 0.6;
const HubHeight = 0.06;
const HubSize = [HubWidth,HubHeight,HubDepth];
const FloorY = 0.3;

function TBox(Center3,Size3)
{
	this.Center3 = Center3 || [0,0,0];
	this.Size3 = Size3 || [1,1,1];
	
	this.GetFrontFaceRect = function()
	{
		let w = this.Size3[0];
		let h = this.Size3[1];
		let x = this.Center3[0] - (w/2);
		let y = this.Center3[1] - (h/2);
		return [x,y,w,h];
	}
}

function TPlug()
{
	this.Alive = true;
	this.Rand = Math.random() * 1000;
	
	this.GetLed0 = function()
	{
		let Lights = [ 0, 0.33, 0.66, 1 ];
		let Rate = 1000;
		let Time = Date.now() + 0 + this.Rand;
		Time = (Time % Rate) / (Rate/Lights.length);
		return Lights[ Math.floor(Time) ];
	}
	this.GetLed1 = function()
	{
		let Lights = [ 0.33, 0, 1, 0.66, 1 ];
		let Rate = 1000;
		let Time = Date.now() + 543436 + this.Rand;
		Time = (Time % Rate) / (Rate/Lights.length);
		return Lights[ Math.floor(Time) ];
	}
}

function THub(PlugCount,HubIndex)
{
	this.Plugs = [];
	this.Box = null;
	
	this.GetBox3 = function()
	{
		return this.Box;
	}
	
	this.InitBox = function()
	{
		let y = FloorY + (HubIndex * HubHeight);
		let x = 0.5;	//	center of screen
		this.Box = new TBox( [x,y,0], HubSize );
	}
	
	//	init plugs
	for ( let i=0;	i<PlugCount;	i++)
		this.Plugs.push( new TPlug() );
	
	//	init box
	this.InitBox();
}

function TGame(HubCount)
{
	this.Hubs = [];

	for ( let i=0;	i<HubCount;	i++)
		this.Hubs.push( new THub(8,i) );
}

