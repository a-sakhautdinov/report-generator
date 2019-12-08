document.addEventListener('DOMContentLoaded', function() {
  // *** header/body ***
  const header = document.getElementById('header');
  const body = document.getElementById('body');
  // *** file input ***
  const inputFile = document.getElementById('upload');
  inputFile.addEventListener('change', parseCSV);
  const dropbox = document.getElementById('dropbox');
  dropbox.addEventListener('dragenter', dragenter, false);
  dropbox.addEventListener('dragover', dragover, false);
  dropbox.addEventListener('drop', drop, false);
  // *** jira link input ***
  const jiraInput = document.getElementById('jiraLink');
  chrome.storage.sync.get(['jiraLink'], function(result) {
    jiraInput.setAttribute('value', result.jiraLink);
    if (!result.jiraLink) {
      body.style.gridTemplateRows = '50% 20% 30%';
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

  const outputs = document.getElementById('outputs');
  outputs.addEventListener('mouseenter', shadowOnHover);
  function shadowOnHover(event) {
    outputs.style.boxShadow = '0 10px 15px 0 rgba(0,0,0,0.24), 0 15px 25px 0 rgba(0,0,0,0.19)';
  }
  outputs.addEventListener('mouseleave', shadowOnOut);
  function shadowOnOut(event) {
    outputs.style.boxShadow = '0 4px 8px 0 rgba(0,0,0,0.24), 0 8px 14px 0 rgba(0,0,0,0.19)';
  }

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

  function saveLinkToLocalStorage() {
    const jiraLink = this.value;
    chrome.storage.sync.set({'jiraLink': jiraLink}, function() {
      message('Jira Link saved');
    });
    chrome.storage.sync.get(['jiraLink'], function(result) {
      jiraInput.setAttribute('value', result.jiraLink);
    });
    setLabelForLink();
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
      chrome.storage.sync.set({'savedOutput': savedOutput, 'savedCopyOutput': savedCopyOutput }, function() {
        message('Outputs saved');
      });
      output.innerHTML = savedOutput;
      copyOutput.innerHTML = savedCopyOutput;
    }
  }

  function copyToClipboard() {
    copyOutput.focus();
    copyOutput.select();
    document.execCommand('copy');
  }

  function setLabelForLink() {
    chrome.storage.sync.get(['jiraLink'], function(result) {
      if (result.jiraLink) {
        document.getElementById('labelForLink').innerHTML = 'Ваша ссылка на Jira:';
      } else {
        document.getElementById('labelForLink').innerHTML = 'Вставьте ссылку на Jira:';
      }
    });
  }

  function downloadCSV() {
    chrome.storage.sync.get(['jiraLink'], function(result) {
      window.open(result.jiraLink);
    });
  }
}, false);
