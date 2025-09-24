declare module 'color-convert' {
  interface HexConverters {
    lab(hex: string): [number, number, number];
  }

  interface RgbLabConverter {
    raw(r: number, g: number, b: number): [number, number, number];
  }

  interface LabRgbConverter {
    raw(l: number, a: number, b: number): [number, number, number];
  }

  interface Convert {
    hex: { lab: HexConverters['lab'] };
    rgb: { lab: RgbLabConverter };
    lab: { rgb: LabRgbConverter };
  }

  const convert: Convert;
  export default convert;
}
