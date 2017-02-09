
// from http://jsfiddle.net/mrbendel/6rbtde5t/1/

export default class DestortImage {

	constructor( image, controls) {

		this.controls = controls
		this.canvas = document.createElement('canvas')
		this.canvas.width = 364
		this.canvas.height = 316
		this.context = this.canvas.getContext('2d')
		this.context.imageSmoothingEnabled = true
		this.context.webkitImageSmoothingEnabled = true

		this.image = image

		this.triangles = []
		this.dirtyTriangles = true



	}


	// rand(s,e) {
	// 	return Math.random() * (e-s) + s
	// }

	draw() {

		this.context.clearRect(0,0,this.canvas.width,this.canvas.height)

		if (this.dirtyTriangles) {
			this.dirtyTriangles = false;
			this.calculateGeometry()
		}
		for (let triangle of this.triangles) {
			this.render(false, this.image, triangle)
		}

	}

	render(wireframe, image, tri) {
		
		if (wireframe) {
			this.context.strokeStyle = "black"
			this.context.beginPath()
			this.context.moveTo(tri.p0.x, tri.p0.y)
			this.context.lineTo(tri.p1.x, tri.p1.y)
			this.context.lineTo(tri.p2.x, tri.p2.y)
			this.context.lineTo(tri.p0.x, tri.p0.y)
			this.context.stroke()
			this.context.closePath()
	    }

	    if (image) {
		    this.drawTriangle(this.context, image,
						 tri.p0.x, tri.p0.y,
						 tri.p1.x, tri.p1.y,
						 tri.p2.x, tri.p2.y,
						 tri.t0.u, tri.t0.v,
						 tri.t1.u, tri.t1.v,
						 tri.t2.u, tri.t2.v)
		}
	}


	calculateGeometry () {

		// clear triangles out
		this.triangles = []

		// generate subdivision
		var subs = 1; // vertical subdivisions
		var divs = 1; // horizontal subdivisions

		var p1 = new Point( this.controls[0].x, this.controls[0].y );
		var p2 = new Point( this.controls[1].x, this.controls[1].y );
		var p3 = new Point( this.controls[2].x, this.controls[2].y );
		var p4 = new Point( this.controls[3].x, this.controls[3].y );

		var dx1 = p4.x - p1.x;
		var dy1 = p4.y - p1.y;
		var dx2 = p3.x - p2.x;
		var dy2 = p3.y - p2.y;

		var imgW = this.image.naturalWidth;
		var imgH = this.image.naturalHeight;

		for (var sub = 0; sub < subs; ++sub) {
			var curRow = sub / subs;
			var nextRow = (sub + 1) / subs;

			var curRowX1 = p1.x + dx1 * curRow;
			var curRowY1 = p1.y + dy1 * curRow;
			
			var curRowX2 = p2.x + dx2 * curRow;
			var curRowY2 = p2.y + dy2 * curRow;

			var nextRowX1 = p1.x + dx1 * nextRow;
			var nextRowY1 = p1.y + dy1 * nextRow;
			
			var nextRowX2 = p2.x + dx2 * nextRow;
			var nextRowY2 = p2.y + dy2 * nextRow;

			for (var div = 0; div < divs; ++div) {
				var curCol = div / divs;
				var nextCol = (div + 1) / divs;

				var dCurX = curRowX2 - curRowX1;
				var dCurY = curRowY2 - curRowY1;
				var dNextX = nextRowX2 - nextRowX1;
				var dNextY = nextRowY2 - nextRowY1;

				var p1x = curRowX1 + dCurX * curCol;
				var p1y = curRowY1 + dCurY * curCol;

				var p2x = curRowX1 + (curRowX2 - curRowX1) * nextCol;
				var p2y = curRowY1 + (curRowY2 - curRowY1) * nextCol;

				var p3x = nextRowX1 + dNextX * nextCol;
				var p3y = nextRowY1 + dNextY * nextCol;

				var p4x = nextRowX1 + dNextX * curCol;
				var p4y = nextRowY1 + dNextY * curCol;

				var u1 = curCol * imgW;
				var u2 = nextCol * imgW;
				var v1 = curRow * imgH;
				var v2 = nextRow * imgH;

				var triangle1 = new Triangle(
					new Point(p1x, p1y),
					new Point(p3x, p3y),
					new Point(p4x, p4y),
					new TextCoord(u1, v1),
					new TextCoord(u2, v2),
					new TextCoord(u1, v2)
				);

				var triangle2 = new Triangle(
					new Point(p1x, p1y),
					new Point(p2x, p2y),
					new Point(p3x, p3y),
					new TextCoord(u1, v1),
					new TextCoord(u2, v1),
					new TextCoord(u2, v2)
				);

				this.triangles.push(triangle1);
				this.triangles.push(triangle2);
			}
		}
	}

	// from http://tulrich.com/geekstuff/canvas/jsgl.js
	drawTriangle (ctx, im, x0, y0, x1, y1, x2, y2,
	    sx0, sy0, sx1, sy1, sx2, sy2) {
	    
	    ctx.save();

	    // Clip the output to the on-screen triangle boundaries.
	    ctx.beginPath();
	    ctx.moveTo(x0, y0);
	    ctx.lineTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.closePath();
	    //ctx.stroke();//xxxxxxx for wireframe
	    ctx.clip();


	    // TODO: eliminate common subexpressions.
	    var denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
	    if (denom == 0) {
	        return;
	    }
	    var m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
	    var m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
	    var m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
	    var m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
	    var dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
	    var dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;

	    ctx.transform(m11, m12, m21, m22, dx, dy);

	    // Draw the whole image.  Transform and clip will map it onto the
	    // correct output triangle.
	    //
	    // TODO: figure out if drawImage goes faster if we specify the rectangle that
	    // bounds the source coords.
	    ctx.drawImage(im, 0, 0);
	    ctx.restore();
	};



	

}

class Point {
	constructor(x,y) {
		this.x = x?x:0
		this.y = y?y:0
	}

	length(point){

		point = point?point:new Point()
		let xs =0, ys =0
		xs = point.x - this.x
		xs = xs * xs

		ys = point.y - this.y
		ys = ys * ys
		return Math.sqrt( xs + ys )
	}
}


class TextCoord{
	constructor(u,v) {
		this.u = u?u:0
		this.v = v?v:0
	}

} 

class Triangle{
	constructor(p0, p1, p2, t0, t1, t2) {
		this.p0 = p0
		this.p1 = p1
		this.p2 = p2
		this.t0 = t0
		this.t1 = t1
		this.t2 = t2
	}
} 


















