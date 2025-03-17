mod timer;
use timer::Timer;

mod utils;

mod complex;

use wasm_bindgen::prelude::*;
mod point_state;
use point_state::PointState;

mod display_operations;
use display_operations::point_states;

#[wasm_bindgen]
pub struct MandelbrotDisplay {
    width: u32,
    height: u32,
    points: Vec<PointState>,
    scale: f64,
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl MandelbrotDisplay {
    pub fn tick(&mut self) {
        let _timer = Timer::new("Universe::tick");

        self.scale *= 0.98; //0.95;
        self.points = point_states(&self.scale, self.width, self.height);
    }

    pub fn new() -> MandelbrotDisplay {
        let width: u32 = 256; //1024;
        let height: u32 = 256; //1024;
        let scale = 0.04; //0.025;

        MandelbrotDisplay {
            width,
            height,
            points: point_states(&scale, width, height),
            scale,
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn points(&self) -> *const PointState {
        self.points.as_ptr()
    }

    // ...
}
