document.addEventListener('DOMContentLoaded', function() {
  // *** header/body ***
  const header = document.getElementById('header');
  const body = document.getElementById('body');
  // *** file input ***
  const inputFile = document.getElementById('upload');
  inputFile.addEventListener('change', parseCSV);
  const dropbox = document.getElementById('body');
  dropbox.addEventListener('dragenter', dragenter, false);
  dropbox.addEventListener('dragover', dragover, false);
  dropbox.addEventListener('drop', drop, false);
  // *** jira link input ***
  const jiraInput = document.getElementById('jiraLink');
  chrome.storage.sync.get(['jiraLink'], function(result) {
    jiraInput.setAttribute('value', result.jiraLink);
    showDownloadButton(result.jiraLink);
    if (!result.jiraLink) {
      body.style.gridTemplateRows = '35% 20% 45%';
      let info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = 'Добро пожаловать в генератор репортов из CSV файлов.'
        + '<br/>Для удобного использования зайдите в Jira на страницу с задачами</br>'
        + 'Перейдите на вкладку все фильтры и нажмите создать фильтр (или используйте имеющийся).</br>'
        + 'Настроив фильтр, нажмите на кнопку <em>"Экспорт"</em>.'
        + ' <strong>Наведите</strong> мышь на <em>"Экспорт в Excel CSV (все поля)"</em>.'
        + 'После чего нажмите правую кнопку мыши и выберите <em>"Копировать адрес ссылки"</em>';
      header.appendChild(info);
    }
  });
  jiraInput.addEventListener('input', saveLinkToLocalStorage);
  setLabelForLink();
  // *** output ***
  const output = document.getElementById('output');
  let savedOutput = '';
  chrome.storage.sync.get(['savedOutput'], function(result) {
    savedOutput = result.savedOutput;
    output.innerHTML = savedOutput;
  });
  const copyOutput = document.getElementById('copyOutput');
  let savedCopyOutput = '';
  chrome.storage.sync.get(['savedCopyOutput'], function(result) {
    savedCopyOutput = result.savedCopyOutput;
    copyOutput.innerHTML = savedCopyOutput;
  });
  // *** download ***
  const download = document.getElementById('download');
  download.addEventListener('click', downloadCSV);
  // *** copy ***
  const copy = document.getElementById('copy');
  copy.addEventListener('click', copyToClipboard);

  // *** drag-n-drop ***
  function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    const dt = e.dataTransfer;
    const file = dt.files[0];
    parseCSV({ dropboxFile: file });
  }

  function showDownloadButton(jiraLink) {
    const linkTest = new RegExp(/^(?:http|https)(?::\/\/)(?:.)*(?:atlassian.net\/)/);
    if (linkTest.test(jiraLink)) {
      download.style.opacity = '1';
      jiraInput.style.borderColor = '#41AA58';
    } else {
      download.style.opacity = '0';
      jiraInput.style.borderColor = 'red';
    }
  }

  function saveLinkToLocalStorage() {
    const jiraLink = this.value;
    chrome.storage.sync.set({'jiraLink': jiraLink});
    chrome.storage.sync.get(['jiraLink'], function(result) {
      jiraInput.setAttribute('value', result.jiraLink);
      showDownloadButton(result.jiraLink);
    });
    setLabelForLink();
  }

  function setLabelForLink() {
    chrome.storage.sync.get(['jiraLink'], function(result) {
      const labelForLink = document.getElementById('labelForLink');
      if (result.jiraLink) {
        labelForLink.innerHTML = 'Jira link:';
      } else {
        labelForLink.innerHTML = 'Input Jira link:';
      }
    });
  }

  function downloadCSV() {
    chrome.storage.sync.get(['jiraLink'], function(result) {
      window.open(result.jiraLink);
    });
  }

  function parseCSV(event) {
    const file = event.dropboxFile ? event.dropboxFile : inputFile.files[0];
    Papa.parse(file, {
      complete: results => updateOutputs({ header: results.data[0], data: results.data }),
    });
  }

  function updateOutputs(info) {
    const { header, data } = info;
    let issueKey = header.indexOf('Issue key');
    let summary = header.indexOf('Summary');
    if (issueKey === -1) {
      issueKey = header.indexOf('Ключ задачи');
      summary = header.indexOf('Pезюме');
    }
    const now = new Date();
    savedOutput = `Отчёт за ${now.getDate()}.${now.getMonth()}:<br/>`;
    savedCopyOutput = '';
    for (let i = 1; i < data.length - 1; ++i) {
      // parse for html
      savedOutput += `${data[i][issueKey]} - ${data[i][summary]}<br/><br/>`;
      // parse for copy
      savedCopyOutput += `${data[i][issueKey]} - ${data[i][summary]}

`;
      chrome.storage.sync.set({'savedOutput': savedOutput, 'savedCopyOutput': savedCopyOutput });
      output.innerHTML = savedOutput;
      copyOutput.innerHTML = savedCopyOutput;
    }
  }

  function copyToClipboard() {
    copyOutput.focus();
    copyOutput.select();
    document.execCommand('copy');
  }
}, false);
