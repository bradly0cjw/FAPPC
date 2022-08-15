const SRT_ID = 'srtFile';
const VIDEO_ID = 'videoFile';


const srtInput = document.querySelector('#srtFile');
const videoInput = document.querySelector('#videoFile');
const video = document.querySelector('#video');
const textArea = document.querySelector('#textArea');
const status = document.querySelector('#status');
const reactTime = 0.4;
let subTexts = [];
let currentStamping = 0;
let lines = [];

function clamp(num) {
  return Math.max(num, 0);
}

const keyMap = {
  'k': video => {
    if (currentStamping >= lines.length) {
      return;
    }

    lines[currentStamping + 1][0] = clamp(video.currentTime - reactTime);
    if (lines[currentStamping][1] > video.currentTime - reactTime || lines[currentStamping][1] === null) {
      lines[currentStamping][1] = clamp(video.currentTime - 0.03 - reactTime);
    }
    currentStamping += 1;
  },
  'l': video => {
    lines[currentStamping] = [
      lines[currentStamping][0],
      video.currentTime - reactTime
    ];
  },
  'i': () => {
    currentStamping -= 1;
  },
  'o': () => {
    currentStamping += 1;
  },
  'u': () => (video.currentTime -= 2),
  'p': () => (video.currentTime += 2),
  'q': () => makeSRT(),
  'w': () => {
    if (video.paused === true) {
      video.play()
    } else {
      video.pause()
    }
  }
};

function getCurrentStatus() {
  return `Stamping Line ${currentStamping} | Playhead: ${video.currentTime}`;
}

function execHotkey(keyMap) {
  document.addEventListener('keypress', function (e) {
    const execFn = keyMap[e.key.toLowerCase()];
    if (typeof execFn === 'function') {
      execFn(video);
      updateContent();
    }
  });
}

function updateContent() {
  const head = '\n** 目前 ---> ';
  const end ='\n'
  console.log(currentStamping-2)
  if ((currentStamping-2)< 0){
    var n=currentStamping
    var content2=Array(3-n).join("\n\n")
  }else{
    n=2
    var content2=""
  }
  const content = subTexts
    // get nearest 5 lines
    .slice(currentStamping-n, currentStamping + 5)
    // return every item
    .map((text, i) => {
      console.log(text, i)
      const [timeStart, timeEnd] = lines[currentStamping + i-n];
      return `${i === n ? head : ''}${text} | ${timeStart} --> ${timeEnd}${i === n ? end : ''}`;
    })
    // conbine element
    .join('\n');
    console.log(content)
  // if((currentStamping - 1)<0){
  //   var content2 = ""
  // }else{  
  //   const [timeStart, timeEnd] = lines[currentStamping-1];
  // var content2 = ("" + subTexts[currentStamping-1]+ " | " + timeStart +"-->" +timeEnd )
  
  // }
  // textArea.value = content2 + ('\n') + content;
  textArea.value =  content2+content;
}

function handleFileUpload(e) {
  if (e.target.files !== null) {
    const reader = new FileReader();
    const file = e.target.files[0];
    /*
      if it's srt file, fill text area with srt content
      if it's video, load it into video tag
    */
    reader.onload = function () {
      if (e.target.id === SRT_ID) {
        // seperate lines into line array
        subTexts = reader.result.split('\n');
        console.log(subTexts)
        // initialization and create time arrary
        subTexts.forEach((_, i) => (lines[i] = [null, null]));
        lines[0][0] = 0;

        updateContent();

        execHotkey(keyMap);
      }
    };

    reader.onerror = function () {
      alert('無法讀取檔案！');
    };

    if (e.target.id === SRT_ID) {
      reader.readAsText(file);
    } else {
      video.src = URL.createObjectURL(file);
    }
  }
}

videoInput.addEventListener('change', handleFileUpload);
srtInput.addEventListener('change', handleFileUpload);

video.addEventListener('timeupdate', function (e) {
  status.textContent = getCurrentStatus();
});

function makeSRT() {
  srt = '';
  for (let i = 0; i < subTexts.length; i++) {
    // line number
    srt += i + 1 + '\n';
    // line time
    let sh, sm, ss, sms;
    let eh, em, es, ems;
    const [timeStart, timeEnd] = lines[i];
    const leftPad = str => `${str}`.padStart(2, '0');
    const leftPad3 = str => `${str}`.padStart(3, '0');
    sh = leftPad(Math.floor(timeStart / 3600));
    sm = leftPad(Math.floor((timeStart % 3600) / 60));
    ss = leftPad(Math.floor(timeStart % 60));
    sms = leftPad3(Math.floor((timeStart * 1000) % 1000));
    eh = leftPad(Math.floor(timeEnd / 3600));
    em = leftPad(Math.floor((timeEnd % 3600) / 60));
    es = leftPad(Math.floor(timeEnd % 60));
    ems = leftPad3(Math.floor((timeEnd * 1000) % 1000));

    srt += `${sh}:${sm}:${ss},${sms} --> ${eh}:${em}:${es},${ems}\n`;
    srt += subTexts[i];
    srt += '\n\n';
  }
  console.log(srt);
  let blob = new Blob([srt], {
    type: 'text/plain;charset=utf-8'
  });
  const a = document.createElement('a');
  const file = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  a.href = URL.createObjectURL(file);
  a.download = 'srt.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

