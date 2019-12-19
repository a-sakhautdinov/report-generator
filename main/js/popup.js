import { ISSUE_KEY, ALL_FIELDS, DEFAULT_FIELDS, LANGUAGES, NAMES, SKIP_FILTERS, SUMMARY } from './constants.js';

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
    jiraInput.setAttribute('value', result.jiraLink || '');
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
  const outputs = document.getElementById('outputs');
  const output = document.getElementById('output');
  let savedOutput = '';
  chrome.storage.sync.get(['savedOutput'], function(result) {
    savedOutput = result.savedOutput;
    if (savedOutput) {
      output.innerHTML = savedOutput;
      outputs.style.opacity = '1';
    } else {
      outputs.style.opacity = '0';
    }
  });
  const copyOutput = document.getElementById('copyOutput');
  let savedCopyOutput = '';
  chrome.storage.sync.get(['savedCopyOutput'], function(result) {
    savedCopyOutput = result.savedCopyOutput;
    copyOutput.innerHTML = savedCopyOutput || '';
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
    const linkTest = new RegExp(/^(?:http|https)(?::\/\/)(?:.)*(?:atlassian.net|olegb.ru\/)/);
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
      complete: results => updateOutputs({ headers: results.meta.fields, data: results.data }),
      header: true,
      skipEmptyLines: true,
    });
  }

  function updateOutputs(info) {
    const { headers, data } = info;

    if (!data.length) return;

    const language = getLanguage(headers);

    // skip custom fields for now (why? idk)
    const skipFilter = SKIP_FILTERS[language];
    const all_fields = Object.keys(data[0]).filter(field => !field.match(skipFilter));
    all_fields.sort((field, nextField) => {
      let fieldObj = DEFAULT_FIELDS.filter(df => df.name[language] === field)[0];
      let fieldWeight = fieldObj
        ? fieldObj.weight
        : DEFAULT_FIELDS.length + 1;
      let nextFieldObj = DEFAULT_FIELDS.filter(df => df.name[language] === nextField)[0];
      let nextFieldWeight = nextFieldObj
        ? nextFieldObj.weight
        : DEFAULT_FIELDS.length + 1;
      if (fieldWeight > nextFieldWeight) return 1;
      if (fieldWeight < nextFieldWeight) return -1;
      return 0;
    });

    // hack here
    // we can add user sort and fields adding
    let selectedFields = all_fields.slice(0, DEFAULT_FIELDS.length);

    const now = new Date();
    let parsedTasks = data.map((task) => {
      text = `${selectedFields.map(field => task[field]).join(' - ')}`;
      if (IN_PROGRESS_STATUSES.includes(task[STATUS.name[language]])) text += ' - wip';
      return text;
    });
    savedOutput =`Отчёт за ${now.getDate()}.${now.getMonth() + 1}:<br/><br/>` + parsedTasks.join('<br/><br/>');
    savedCopyOutput = parsedTasks.join('\n\n');

    chrome.storage.sync.set({'savedOutput': savedOutput, 'savedCopyOutput': savedCopyOutput });
    output.innerHTML = savedOutput;
    outputs.style.opacity = '1';
    copyOutput.innerHTML = savedCopyOutput;
  }

  function getLanguage(headers) {
    if (headers.includes('Summary')) return LANGUAGES.EN;
    if (headers.includes('Pезюме')) return LANGUAGES.RU_1;
    if (headers.includes('Тема')) return LANGUAGES.RU_2;
  }

  function copyToClipboard() {
    copyOutput.focus();
    copyOutput.select();
    document.execCommand('copy');
    copy.innerHTML = 'Copied!';
    setTimeout(() => copy.innerHTML = 'Copy to Clipboard', 2000);
  }
}, false);
