//global selections
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexs = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButtons = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainer = document.querySelectorAll(".sliders");
// array to save colors
// otherwise saturation will brake the magic
let initialColors;
// object for local storage
let savedPalettes = [];
//save to local storage
const saveButton = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
//library
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");
//Event listener

generateBtn.addEventListener("click", randomColors);
sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});

colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});

//clicking hex color copies to clipboard
currentHexs.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popup.classList.remove("active");
  popupBox.classList.remove("active");
});

adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    opendAjustmentPanel(index);
  });
});

closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});
lockButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    lockColor(button, index);
  });
});

//save to local storage
saveButton.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);

//library
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);

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
  // initialize colors array
  initialColors = [];
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();
    // push hex colors to array
    if (div.classList.contains("locked")) {
      // keep last color
      initialColors.push(hexText.innerText);
      // do nothing else
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }
    // add colors to the background
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    //check for contrast
    checkTextContrast(randomColor, hexText);
    // check icons contrast
    const icons = div.querySelectorAll(".controls button");
    for (icon of icons) {
      checkTextContrast(randomColor, icon);
    }
    // initial colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });
  // update sliders cursor
  resetInputs();
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

function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");
  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];

  const bgColor = initialColors[index];
  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);

  colorDivs[index].style.backgroundColor = color;

  // update sliders background upon changing color
  colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();
  //check contrast
  checkTextContrast(color, textHex);
  // check contrast of icons
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  // grab all the sliders
  sliders.forEach((slider) => {
    // for each slider filter if it's hue, saturation or brightness slider
    if (slider.name === "hue") {
      // get which color is changing
      const hueColor = initialColors[slider.getAttribute("data-hue")];
      // get the hue of the color I changed
      const hueValue = chroma(hueColor).hsl()[0];
      // set cursor to the color number
      slider.value = Math.floor(hueValue);
    }
    if (slider.name === "saturation") {
      const satColor = initialColors[slider.getAttribute("data-sat")];
      const satValue = chroma(satColor).hsl()[1];
      // rounding numbers
      slider.value = Math.floor(satValue * 100) / 100;
    }
    if (slider.name === "brightness") {
      const brightColor = initialColors[slider.getAttribute("data-bright")];
      const brightValue = chroma(brightColor).hsl()[2];
      slider.value = Math.floor(brightValue * 100) / 100;
    }
    // sliders are all the input range
    sliders.forEach((slider) => {
      const index =
        slider.getAttribute("data-bright") ||
        slider.getAttribute("data-sat") ||
        slider.getAttribute("data-hue");
      // sliderConatiner is the block of slider for each color
      let slidersContainer = slider.parentElement.querySelectorAll(
        'input[type="range"]'
      );
      const hue = slidersContainer[0];
      const brightness = slidersContainer[1];
      const saturation = slidersContainer[2];

      const bgColor = initialColors[index];
      let color = chroma(bgColor)
        .set("hsl.s", saturation.value)
        .set("hsl.l", brightness.value)
        .set("hsl.h", hue.value);

      // update sliders background upon changing color
      colorizeSliders(color, hue, brightness, saturation);
    });
  });
}

function copyToClipboard(hex) {
  // copy function from text doesn't exist
  // create a temporary text area
  const element = document.createElement("textarea");
  //copy hexColor text to textarea
  element.value = hex.innerText;
  //append textarea to body
  document.body.appendChild(element);
  // select the textarea
  element.select();
  // execute command copy to clipboard
  document.execCommand("copy");
  // destroy temporary textarea
  document.body.removeChild(element);
  // popupanimation
  const popupBox = popup.children[0];
  popup.classList.add("active");
  popupBox.classList.add("active");
}

function opendAjustmentPanel(index) {
  sliderContainer[index].classList.toggle("active");
}

function closeAdjustmentPanel(index) {
  sliderContainer[index].classList.remove("active");
}

function lockColor(button, index) {
  colorDivs[index].classList.toggle("locked");
  lockButtons[index].firstChild.classList.toggle("fa-lock-open");
  lockButtons[index].firstChild.classList.toggle("fa-lock");
}

// save to local storage
function openPalette() {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
}
function closePalette() {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
}

function savePalette(e) {
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  const name = saveInput.value;
  const colors = [];
  currentHexs.forEach((hex) => {
    colors.push(hex.innerText);
  });
  //generate object to push in local storage
  let paletteNr;
  const paletteOjects = JSON.parse(localStorage.getItem("palettes"));
  if (paletteOjects === null) {
    paletteNr = savedPalettes.length;
  } else {
    paletteNr = paletteOjects.length;
  }

  const paletteObj = { name, colors, nr: paletteNr };
  savedPalettes.push(paletteObj);
  // save to local sorage
  savetoLocal(paletteObj);
  saveInput.value = "";
  // generate palette for library
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObj.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach((smallColor, index) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });
  const paletteBtn = document.createElement("button");
  paletteBtn.classList.add("pick-palette-btn");
  paletteBtn.classList.add(paletteObj.nr);
  paletteBtn.innerText = "Select";

  //attach event to the button
  paletteBtn.addEventListener("click", (e) => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      updateTextUI(index);
    });
    resetInputs();
  });
  // append to library
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteBtn);
  libraryContainer.children[0].appendChild(palette);
}

function savetoLocal(palette) {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }
  localPalettes.push(palette);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}
function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

function getLocal() {
  const paletteOjects = JSON.parse(localStorage.getItem("palettes"));
  if (paletteOjects === null) {
    localPalettes = [];
  } else {
    savedPalettes = [...paletteOjects];
    paletteOjects.forEach((paletteObj) => {
      const palette = document.createElement("div");
      palette.classList.add("custom-palette");
      const title = document.createElement("h4");
      title.innerText = paletteObj.name;
      const preview = document.createElement("div");
      preview.classList.add("small-preview");
      paletteObj.colors.forEach((smallColor, index) => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
      });
      const paletteBtn = document.createElement("button");
      paletteBtn.classList.add("pick-palette-btn");
      paletteBtn.classList.add(paletteObj.nr);
      paletteBtn.innerText = "Select";

      //attach event to the button
      paletteBtn.addEventListener("click", (e) => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        paletteOjects[paletteIndex].colors.forEach((color, index) => {
          initialColors.push(color);
          colorDivs[index].style.backgroundColor = color;
          updateTextUI(index);
        });
        resetInputs();
      });
      // append to library
      palette.appendChild(title);
      palette.appendChild(preview);
      palette.appendChild(paletteBtn);
      libraryContainer.children[0].appendChild(palette);
    });
  }
}

getLocal();
randomColors();
