fn main() {
    let _ = rubato::FftFixedIn::<f32>::new(44100, 16000, 1024, 1, 1);
}
