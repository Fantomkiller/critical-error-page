/** Critical Error — Google Forms → Discord. Set DISCORD_WEBHOOK_URL in Script Properties first. */
function setupRecruitment() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DISCORD_WEBHOOK_URL')) throw new Error('Set DISCORD_WEBHOOK_URL in Script Properties first.');
  var id = props.getProperty('RECRUITMENT_FORM_ID');
  var form = id ? FormApp.openById(id) : FormApp.create('Critical Error — zgłoszenie do gildii');
  if (!id) {
    form.setDescription('EU Burning Legion · środa i czwartek, 19:45–23:00. Opowiedz nam o swojej postaci. Odpowiemy na Discordzie.');
    form.setConfirmationMessage('Dzięki za zgłoszenie! Odezwiemy się na Discordzie.');
    form.addTextItem().setTitle('Nick na Discordzie').setRequired(true);
    form.addTextItem().setTitle('Postać i realm').setRequired(true);
    form.addListItem().setTitle('Rola').setChoiceValues(['Tank', 'Heal', 'Melee DPS', 'Ranged DPS']).setRequired(true);
    form.addTextItem().setTitle('Klasa i specjalizacja').setRequired(true);
    form.addTextItem().setTitle('Link do Warcraft Logs').setRequired(true);
    form.addParagraphTextItem().setTitle('Doświadczenie i kilka słów o sobie').setRequired(true);
    form.addListItem().setTitle('Czy możesz raidować w środy i czwartki 19:45–23:00?').setChoiceValues(['Tak', 'Zwykle tak', 'Nie']).setRequired(true);
    props.setProperty('RECRUITMENT_FORM_ID', form.getId());
  }
  var exists = ScriptApp.getProjectTriggers().some(function (trigger) { return trigger.getHandlerFunction() === 'notifyDiscord'; });
  if (!exists) ScriptApp.newTrigger('notifyDiscord').forForm(form).onFormSubmit().create();
  Logger.log('Adres formularza: ' + form.getPublishedUrl());
  Logger.log('Adres edycji: ' + form.getEditUrl());
}

function notifyDiscord(event) {
  if (!event || !event.response) throw new Error('This function runs only from a Google Forms submit trigger.');
  var webhook = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
  if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+/.test(webhook || '')) throw new Error('Invalid Discord webhook URL.');
  var answers = event.response.getItemResponses().map(function (item) {
    return { name: String(item.getItem().getTitle()).slice(0, 100), value: String(item.getResponse() || '—').slice(0, 950), inline: false };
  });
  var payload = {
    username: 'Critical Error · Rekrutacja', allowed_mentions: { parse: [] },
    embeds: [{ title: 'Nowe zgłoszenie do gildii', color: 10038582, fields: answers,
      footer: { text: 'Critical Error · EU Burning Legion' }, timestamp: new Date().toISOString() }]
  };
  var response = UrlFetchApp.fetch(webhook, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Discord webhook returned HTTP ' + response.getResponseCode());
}
