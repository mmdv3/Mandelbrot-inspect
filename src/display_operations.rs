use crate::complex::Complex;
use crate::point_state::PointState;

fn close_to_mandelbrot(
    c: Complex,
    iterations: &u16,
    dist_bound_sq: &f64,
    scale: &f64,
) -> bool {
    // Implements exterior distance algotithm. See 3.3.1 of
    // https://theses.liacs.nl/pdf/2018-2019-JonckheereLSde.pdf

    const SHIFT: u16 = 1;
    let close_enough = 0.1;
    let unit = Complex::new(1.0, 0.0);
    let mut z = Complex::new(0.0, 0.0);
    let mut z_prime = Complex::new(0.0, 0.0);

    for _i in 1..=*iterations {
        if z.module_sq() > *dist_bound_sq {
            let d = z.module() * z.module().log10() / z_prime.module();

            if d < *scale * close_enough {
                return true;
            } else {
                return false;
            }
        }

        z_prime = Complex::new(2.0, 0.0) * z.clone() * z_prime + &unit;
        z = z.clone() * z + &c;
    }

    true
}

fn calc_image_center(scale: &f64) -> Complex {
    let _leftmost = Complex::new(-2.0, 0.0);
    let _right_endpoint = Complex::new(0.268, 0.0);
    // Misiurewicz points
    let _m_23_2 = Complex::new(-0.10109636384562, 0.95628651080914);

    _m_23_2
    // _right_endpoint
}

pub fn point_states(scale: &f64, width: u32, height: u32) -> Vec<PointState> {
    const MAX_ITERATIONS: u16 = 40;
    const DIST_BOUND_SQ: f64 = 4.0;

    let mut cells: Vec<PointState> = Vec::new();

    let image_center = calc_image_center(&scale);
    let height_mid = (height + 1) / 2;
    let width_mid = (width + 1) / 2;

    for w in 0..width {
        for h in 0..height {
            let is_close = close_to_mandelbrot(
                Complex::at_scale(
                    h as i32 - height_mid as i32,
                    w as i32 - width_mid as i32,
                    scale,
                ) + &image_center,
                &MAX_ITERATIONS,
                &DIST_BOUND_SQ,
                &scale,
            );
            if is_close {
                cells.push(PointState::Near)
            } else {
                cells.push(PointState::Far)
            }
        }
    }
    cells
}
