const HubWidth = 0.6;
const HubDepth = 0.6;
const HubHeight = 0.06;
const HubSize = [HubWidth,HubHeight,HubDepth];
const FloorY = 0.3;

function Range(Min,Max,Value)
{
	return (Value-Min) / (Max-Min);
}

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
	this.Alive = false;
	this.Rand = Math.random() * 1000;
	
	this.GetLed0 = function()
	{
		if ( this.Alive )
			return 1;
		return 0;
		let Lights = [ 0, 0.33, 0.66, 1 ];
		let Rate = 1000;
		let Time = Date.now() + 0 + this.Rand;
		Time = (Time % Rate) / (Rate/Lights.length);
		return Lights[ Math.floor(Time) ];
	}
	
	this.GetLed1 = function()
	{
		if ( this.Alive )
			return 1;
		return 0;
		let Lights = [ 0.33, 0, 1, 0.66, 1 ];
		let Rate = 1000;
		let Time = Date.now() + 543436 + this.Rand;
		Time = (Time % Rate) / (Rate/Lights.length);
		return Lights[ Math.floor(Time) ];
	}
	
	this.OnGrab = function()
	{
		this.Alive = true;
	}

	this.OnRelease = function()
	{
		this.Alive = false;
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
	
	this.GetPlugIndexAt = function(Pos2)
	{
		let Rect2 = this.GetBox3().GetFrontFaceRect();
		let x = Math.floor(Range( Rect2[0], Rect2[0]+Rect2[2], Pos2[0] ) * this.Plugs.length);
		let y = Math.floor(Range( Rect2[1], Rect2[1]+Rect2[3], Pos2[1] ));
		return (x>=0)&&(x<this.Plugs.length)&&(y==0) ? x : false;
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

function TGame()
{
	this.Hubs = [];
	this.GrabbedHubPort = null;	//	[hub,port]
	
	this.AddHub = function()
	{
		let Index = this.Hubs.length;
		this.Hubs.push( new THub(8,Index) );
	}
	
	this.ReleaseGrabbedHubPort = function()
	{
		if ( this.GrabbedHubPort == null )
			return;
		let Hub = this.Hubs[this.GrabbedHubPort[0]];
		let Plug = Hub.Plugs[this.GrabbedHubPort[1]];
		Plug.OnRelease();
		this.GrabbedHubPort = null;
	}
	
	this.GrabHubPort = function(HubIndex,PortIndex)
	{
		if ( this.GrabbedHubPort !== null )
		{
			if ( this.GrabbedHubPort[0] == HubIndex && this.GrabbedHubPort[0] == HubIndex )
				return;
			this.ReleaseGrabbedHubPort();
		}
		this.GrabbedHubPort = [HubIndex,PortIndex];
		let Hub = this.Hubs[this.GrabbedHubPort[0]];
		let Plug = Hub.Plugs[this.GrabbedHubPort[1]];
		Plug.OnGrab();
	}
	
	this.UpdateInput = function(Down,Position)
	{
		//	are we still over the last one?
		if ( this.GrabbedHubPort != null )
		{
			let Hub = this.Hubs[this.GrabbedHubPort[0]];
			let OverPlugIndex = Hub.GetPlugIndexAt( Position );
			if ( /*OverPlugIndex === null ||*/ OverPlugIndex !== this.GrabbedHubPort[1] )
			{
				this.ReleaseGrabbedHubPort();
			}
			else
			{
				//	still over
			}
		}
		else
		{
			let HoverHubPort = null;
			let FindHoverHubPort = function(Hub,HubIndex)
			{
				let PortIndex = Hub.GetPlugIndexAt(Position);
				if ( PortIndex === false )
					return;
				HoverHubPort = [HubIndex,PortIndex];
			}
			this.Hubs.forEach( FindHoverHubPort );
			if ( HoverHubPort !== null )
				this.GrabHubPort( HoverHubPort[0], HoverHubPort[1] );
		}
	}
}

