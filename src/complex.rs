// Single precision computations on complex numbers.
// Arbitrary precision arithmetic libraries are not used
// due to conflicts with wasm32-unknown-unknown architecture
// used by wasm-pack
use std::ops::{Add, Mul};

#[derive(Clone, Debug)]
pub struct Complex {
    x: f64,
    y: f64,
}

impl Complex {
    pub fn at_scale(x: i32, y: i32, scale: &f64) -> Complex {
        Complex {
            x: (x as f64) * scale,
            y: (y as f64) * scale,
        }
    }

    pub fn new(x: f64, y: f64) -> Complex {
        Complex { x, y }
    }

    pub fn module(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn module_sq(&self) -> f64 {
        self.x * self.x + self.y * self.y
    }
}

impl Add<&Complex> for Complex {
    type Output = Self;

    fn add(self, other: &Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl Mul<&Complex> for Complex {
    type Output = Self;

    fn mul(self, other: &Complex) -> Self {
        Self {
            x: self.x * other.x - self.y * other.y,
            y: self.x * other.y + self.y * other.x,
        }
    }
}

impl Mul<Complex> for Complex {
    type Output = Self;

    fn mul(self, other: Complex) -> Self {
        Self {
            x: self.x * other.x - self.y * other.y,
            y: self.x * other.y + self.y * other.x,
        }
    }
}