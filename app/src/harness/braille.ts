// Grade-1 (uncontracted) Unicode braille mapping.
// Letters, digits and common punctuation map to their 6-dot cell; unknown
// characters pass through unchanged.

const CHARS = " A1B'K2L@CIF/MSP\"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)=";
const CELLS = "⠀⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿";

const MAP: Record<string, string> = {};
for (let i = 0; i < CHARS.length; i++) MAP[CHARS[i]] = CELLS[i];

export function toBraille(text: string): string {
  return [...text.toUpperCase()].map((ch) => MAP[ch] ?? ch).join("");
}
