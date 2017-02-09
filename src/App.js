
import DistortImage from './DistortImage'
GIF = window.GIF
import 'whatwg-fetch'
import Promise from 'es6-promise'

export default class App {

	constructor() {

		
		this.baseImages = []
		this.maskImages = []

		this.defaultImages = []

		this.frame = 0
		this.fps = 8
		this.rendering = false

		const canvas = document.getElementById("main-canvas")
		this.context = canvas.getContext("2d")

		const p = document.createElement('p')
		p.setAttribute('id', 'loading')
		p.textContent = "Loading..."
		document.body.appendChild(p)

		document.querySelector(".main-container").style.display = 'none'
				
		fetch("./track.json")

			.then( (data)=>{
				return data.json()
			})

			.then((json)=>{
				// reorder 
				for(let i=0; i<json.vertices.left.length; i++){
					let arr = json.vertices.left[i]
					arr.unshift(arr.pop())
					arr.unshift(arr.pop())
				}
				for(let i=0; i<json.vertices.right.length; i++){
					let arr = json.vertices.right[i]
					arr.unshift(arr.pop())
					arr.unshift(arr.pop())
				}
				this.trackData = json
			})

			.then( ()=>{

				return new Promise( (resolve, reject) => {

					let loadCnt = 45

					for(let i=0; i<loadCnt; i++){

						this.baseImages[i] = null

						fetch(`images/base/base_${i}.jpg`)
							.then((response)=>{
								response.blob()
									.then( (blob)=>{
										const image = new Image()
										image.src = URL.createObjectURL(blob)
										this.baseImages[i] = image
										if(--loadCnt==0) resolve()
									} )
							})
					}
					
				} );

			} )

			.then( ()=>{

				return new Promise( (resolve, reject) => {

					let loadCnt = 45

					for(let i=0; i<loadCnt; i++){

						this.maskImages[i] = null

						fetch(`images/mask/mask_${i}.png`)
							.then((response)=>{
								response.blob()
									.then( (blob)=>{
										const image = new Image()
										image.src = URL.createObjectURL(blob)
										this.maskImages[i] = image
										if(--loadCnt==0) resolve()
									} )
							})
					}
					
				} );

			} )



			.then( ()=>{

				return new Promise((resolve, reject) => {
					
					let loadCnt = 2
					for(let i=0; i<loadCnt; i++){
						this.defaultImages[i] = null
						fetch( `images/default${i+1}.jpg` )
							.then((response)=>{
								response.blob()
									.then( (blob)=>{
										const image = new Image()
										image.src = URL.createObjectURL(blob)
										this.defaultImages[i] = image
										image.addEventListener( "load", ()=>{
											if(--loadCnt==0) resolve()	
										})
									} )
							})

					}

				});

			} )

			.then(()=>{

				const controls = this.createControls(0)

				this.dImageLeft = new DistortImage( this.defaultImages[0],  controls.left )
				this.dImageLeft.draw()
				this.dImageRight = new DistortImage( this.defaultImages[1],  controls.right )
				this.dImageRight.draw()


				document.getElementById("file1").addEventListener("change", (evt)=>{
					this.changeImage( evt.target.files[0], "left" )
				})

				document.getElementById("file2").addEventListener("change", (evt)=>{
					this.changeImage( evt.target.files[0], "right" )
				})

				document.getElementById("download").addEventListener("click", (evt)=>{
					this.downloadGIF()
				})

				setInterval( this.animate.bind(this), 1000/this.fps)

				document.querySelector(".main-container").style.removeProperty('display')
				document.body.removeChild(p)
				
			})

	}

	downloadGIF(){

		for(let input of document.querySelectorAll("input")){
			input.disabled = true
		}

		let p = document.createElement('p')
		p.setAttribute('id','processing')
		p.textContent = "Processing..."
		document.body.appendChild(p)

		this.gif = new GIF({
			workers: 4,
			workerScript: '/js/gif.worker.js',
			width: 364,
			height: 316
		})

		this.gif.on('start', ()=>{
			// const startTime = Date.now()
			// console.log(startTime)
		})

		this.gif.on('finished', (blob)=>{

			const evt = document.createEvent('MouseEvents')
			evt.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
			const a = document.createElement('a')
			a.href = URL.createObjectURL(blob)
			a.download = "animation.gif"
			a.dispatchEvent(evt)

			for(let input of document.querySelectorAll("input")){
				input.disabled = false
			}

			document.body.removeChild(document.getElementById("processing"))

		})

		this.frame = 0
		this.rendering = true


	}

	changeImage(file, side){
		const reader = new FileReader()
		reader.addEventListener("load", ()=> {
			const image = new Image()
			image.addEventListener("load",()=>{
				if(side=="left"){
					this.dImageLeft.image = this.resizeImage(image)
				}else{
					this.dImageRight.image = this.resizeImage(image)
				}
			})
			image.src = reader.result

		}, false);

		if (file) {
			reader.readAsDataURL(file)
		}

	}

	resizeImage(image){
		const canvas = document.createElement('canvas')
		canvas.width = 180
		canvas.height = 256
		const context = canvas.getContext('2d')
		const cAspect = canvas.width/canvas.height

		const aspect = image.width/image.height
		let scale = 1
		let offsetX = 0 
		let offsetY = 0

		if(aspect>=cAspect){
			scale = 256/image.height
			offsetX = (180 - image.width*scale)/2
			offsetY = 0
		}else{
			scale = 180/image.width
			offsetX = 0
			offsetY = (256 - image.height*scale)/2			
		}
		context.drawImage(image, offsetX, offsetY, image.width*scale, image.height*scale)

		const img = new Image()
		img.src = canvas.toDataURL()
		return img
	}


	createControls(num){

		let left = []
		let j = 0
		for(let i=0; i<4; i++){
			left[i] = {x:this.trackData.vertices.left[num][j], y:this.trackData.vertices.left[num][j+1]}
			j+=2
		}
		left.push(left.shift())
		left.push(left.shift())
		left.reverse()

		let right = []
		j = 0
		for(let i=0; i<4; i++){
			right[i] = {x:this.trackData.vertices.right[num][j], y:this.trackData.vertices.right[num][j+1]}
			j+=2
		}
		right.push(right.shift())
		right.push(right.shift())
		right.reverse()

		return {left:left, right:right}

	}

	animate(){
		// requestAnimationFrame( this.animate.bind(this) )
		if(++this.frame >= this.baseImages.length){ 
			this.frame = 0
			if(this.rendering){
				this.gif.render()
				this.rendering = false
			}
		}

		this.context.clearRect(0,0,364,316)
		this.context.imageSmoothingEnabled = true
		this.context.webkitImageSmoothingEnabled = true

		const controls = this.createControls(this.frame)

		this.dImageLeft.dirtyTriangles = true
		this.dImageLeft.controls = controls.left
		this.dImageLeft.draw()

		this.dImageRight.dirtyTriangles = true
		this.dImageRight.controls = controls.right
		this.dImageRight.draw()

		this.context.drawImage(this.dImageLeft.canvas, 0, 0)
		this.context.drawImage(this.dImageRight.canvas, 0, 0)

		this.context.globalCompositeOperation = 'destination-out'
		this.context.drawImage( this.maskImages[this.frame], 0, 0 )
		
		this.context.globalCompositeOperation = 'multiply'
		this.context.drawImage(this.baseImages[this.frame],0,0)

		if(this.rendering) this.gif.addFrame( this.context, {copy: true, delay: 1000/this.fps} )

	}




}