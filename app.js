//global selections
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexs = document.querySelectorAll(".color h2");
let initialColors;

// functions

// generate colors
//Manually
// function generateHex() {
//   const letters = "0123456789ABCDEF";
//   let hash = "#";
//   for (let i = 0; i < 6; i++) {
//     hash += letters[Math.floor(Math.random() * 16)];
//   }
//   return hash;
// }

//generate colors with chroma js
function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

function randomColors() {
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();

    // add colors to the background
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    //check for contrast
    checkTextContrast(randomColor, hexText);

    // initial colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });
}

// check if i can read the text whit that background
function checkTextContrast(color, text) {
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  // get the color without saturation
  const noSaturation = color.set("hsl.s", 0);
  // get the color with full saturation
  const fullSaturation = color.set("hsl.s", 1);
  //scale saturazion
  const scaleSaturation = chroma.scale([noSaturation, color, fullSaturation]);
  //update slider color
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSaturation(
    0
  )}, ${scaleSaturation(1)})`;

  //start from black to white i need the only middle part
  const midBright = color.set("hsl.l", 0.5);
  //form black to white with all the gradients
  const scaleBright = chroma.scale(["black", midBright, "white"]);
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
    0
  )}, ${scaleBright(0.5)}, ${scaleBright(1)})`;

  //Hue is always the same all the colors
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204), rgb(204,75,75))`;
}

randomColors();
