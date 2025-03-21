import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
import { MandelbrotDisplay, PointState } from "wasm-game-of-life";

const CELL_SIZE = 1;//3;//5; // px
const BORDER_WIDTH = 1; // px

///// init
const display = MandelbrotDisplay.new();
const width = display.width();
const height = display.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = CELL_SIZE * height + 2 * BORDER_WIDTH;
canvas.width = CELL_SIZE * width + 2 * BORDER_WIDTH;
const gl = canvas.getContext("webgl");
gl.clearColor(1, 1, 1, 1); // every time canvas is cleared it is white


if (!gl) {
  console.error("WebGL not supported, falling back on experimental-webgl");
  gl = canvas.getContext("experimental-webgl");
}

if (!gl) {
  alert("Your browser does not support WebGL");
}

const maxPoints = width * height * 4 * 2; // Assuming each cell needs 4 vertices with 2 coordinates each
//const pointBuffer = new Float32Array(maxPoints);
const pointBuffer = gl.createBuffer();
//gl.bufferData(gl.ARRAY_BUFFER, pointBuffer, gl.DYNAMIC_DRAW);

gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
//gl.bufferData(gl.ARRAY_BUFFER, maxPoints * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(maxPoints), gl.DYNAMIC_DRAW);
//////

const getIndex = (row, column) => {
  return row * width + column;
};



/// fps
const fps = new class {
  constructor() {
    this.fps = document.getElementById("fps");
    this.frames = [];
    this.lastFrameTimeStamp = performance.now();
  }

  render() {
    // Convert the delta time since the last frame render into a measure
    // of frames per second.
    const now = performance.now();
    const delta = now - this.lastFrameTimeStamp;
    this.lastFrameTimeStamp = now;
    const fps = 1 / delta * 1000;

    // Save only the latest 100 timings.
    this.frames.push(fps);
    if (this.frames.length > 100) {
      this.frames.shift();
    }

    // Find the max, min, and mean of our 100 latest timings.
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < this.frames.length; i++) {
      sum += this.frames[i];
      min = Math.min(this.frames[i], min);
      max = Math.max(this.frames[i], max);
    }
    let mean = sum / this.frames.length;

    // Render the statistics.
    this.fps.textContent = `
Frames per Second:
         latest = ${Math.round(fps)}
avg of last 100 = ${Math.round(mean)}
min of last 100 = ${Math.round(min)}
max of last 100 = ${Math.round(max)}
`.trim();
  }
};
///


//// webGL
const vertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;
void main() {
	// convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;
  	// convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;
  	// convert from 0->2 to -1->+1 (clip space)
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program failed to link:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

function prepToDraw() {
  gl.useProgram(program);
  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
  
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
}
function drawBorder() {
  const positions = [];
  
  for (let i = 0; i < BORDER_WIDTH; i++) {
    positions.push(i, 0);
    positions.push(i, canvas.height);

    positions.push(canvas.width - i, 0);
    positions.push(canvas.width - i, canvas.height);
  }
  
  for (let j = 0; j < BORDER_WIDTH; j++) {
    positions.push(0, j);
    positions.push(canvas.width, j);

    positions.push(0, canvas.height - j);
    positions.push(canvas.width, canvas.height - j);
  }
  

  
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions));
  gl.uniform4f(colorUniformLocation, 0, 0, 0, 1); // black
  gl.drawArrays(gl.LINES, 0, positions.length / 2);
}

function drawPoints() {
  const pointsPtr = display.points();
  const points = new Uint8Array(memory.buffer, pointsPtr, width * height);

  const farPoints = [];
  const nearPoints = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const x = col * CELL_SIZE + BORDER_WIDTH;
      const y = row * CELL_SIZE + BORDER_WIDTH;
      const pointState = points[getIndex(row, col)];

      const positions = [
        x, y,
        x + CELL_SIZE, y,
        x, y + CELL_SIZE,
        x + CELL_SIZE, y + CELL_SIZE,
      ];

        if (pointState === PointState.Far) {
        farPoints.push(...positions);
      } else {
        nearPoints.push(...positions);
      }
    }
  }

  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(nearPoints));
  gl.uniform4f(colorUniformLocation, 0, 0, 0, 1); // (black)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, nearPoints.length / 2);

  // Draw alive cells on top
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(farPoints));
  gl.uniform4f(colorUniformLocation, 1, 1, 1, 1); // (white)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, farPoints.length / 2);

}

function drawObjects() {
  prepToDraw();
  drawBorder();
  drawPoints();
}
/////


const renderLoop = () => {
  //debugger;

  fps.render();
  display.tick();

  gl.clear(gl.COLOR_BUFFER_BIT);
  drawObjects();

  requestAnimationFrame(renderLoop);
};

drawObjects();
requestAnimationFrame(renderLoop);

