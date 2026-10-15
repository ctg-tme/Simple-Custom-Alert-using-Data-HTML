/********************************************************
Copyright (c) 2026 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************

 * Author(s):               Robert(Bobby) McGonigle Jr
 *                          Technical Marketing Engineering, Technical Leader
 *                          Cisco Systems
 * 
 * Date: October 15, 2026
 * Revised: October 15, 2026
 * Version: 1.0.0
 * 
 * Description: Simple Custom Alert Message using Data HTML tags
*/


import xapi from 'xapi';

/**
 * Options accepted by {@link draftAlertHTML}.
 *
 * Values are converted to strings before being inserted into the HTML.
 *
 * @typedef {Object} DraftAlertOptions
 * @property {unknown} [Header=""] Header content.
 * @property {unknown} [Title=""] Main heading content.
 * @property {unknown} [Text=""] Paragraph content.
 * @property {unknown} [BackgroundColor="#fff"] Page background color.
 * @property {unknown} [TextColor="#000"] Default page and paragraph text color.
 * @property {unknown} [HeaderColor="#000"] Header background color.
 * @property {unknown} [HeaderTextColor="#fff"] Header text color.
 * @property {unknown} [HeaderTextSize="24px"] Header text size.
 * @property {unknown} [TitleColor=TextColor] Heading text color.
 * @property {unknown} [TitleTextSize="72px"] Heading text size.
 * @property {unknown} [TextTextSize="48px"] Paragraph text size.
 */

/**
 * Creates a data URL containing an HTML alert page.
 *
 * The generated HTML must be no longer than 2,000 characters. If it exceeds
 * that limit, the thrown error includes the submitted option values' character
 * counts, sorted from highest to lowest.
 *
 * @param {DraftAlertOptions} [options={}] Alert content and styling options.
 * @returns {string} URL-encoded `data:text/html` URL.
 * @throws {Error} If the generated HTML exceeds 2,000 characters.
 */
function draftAlertHTML(options = {}) {
  const colorMap = {
    aqua: "#00ffff",
    black: "#000000",
    blue: "#0000ff",
    fuchsia: "#ff00ff",
    gray: "#808080",
    green: "#008000",
    lime: "#00ff00",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#ffa500",
    purple: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    teal: "#008080",
    white: "#ffffff",
    yellow: "#ffff00"
  };

  const value = (key, fallback = "") =>
    String(options?.[key] ?? fallback);

  const color = (key, fallback) => {
    const input = value(key, fallback).trim().toLowerCase();
    if (colorMap[input]) return colorMap[input];

    const hex = input.startsWith("#") ? input : `#${input}`;
    if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) {
      throw new Error(`Invalid color for ${key}: ${input}`);
    }
    return hex;
  };

  const header = value("Header");
  const title = value("Title");
  const text = value("Text");
  const hasHeader = header.trim() !== "";
  const hasText = text.trim() !== "";

  const backgroundColor = color("BackgroundColor", "#fff");
  const textColor = color("TextColor", "#000");

  const titlePosition = hasText
    ? "margin: 24px 0 0;"
    : `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% - 32px);
        margin: 0;
      `;

  const html = `
    <!doctype html>
    <html>
      <body style="
        margin: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: ${backgroundColor};
        color: ${textColor};
        font-family: sans-serif;
      ">
        ${hasHeader
      ? `<header style="
                padding: 14px;
                background: ${color("HeaderColor", "#000")};
                color: ${color("HeaderTextColor", "#fff")};
                text-align: left;
                font-size: ${value("HeaderTextSize", "36px")};
                font-weight: bold;
              ">${header}</header>`
      : ""
    }

        <main style="
          flex: 1;
          position: relative;
          display: block;
          text-align: center;
        ">
          <h1 style="
            ${titlePosition}
            font-size: ${value("TitleTextSize", "72px")};
            color: ${color("TitleColor", textColor)};
          ">${title}</h1>

          ${hasText
      ? `<p style="
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: calc(100% - 32px);
                  margin: 0;
                  font-size: ${value("TextTextSize", "48px")};
                  color: ${color("TextColor", textColor)};
                  text-align: center;
                ">${text}</p>`
      : ""
    }
        </main>
      </body>
    </html>
  `.trim();

  const compactHtml = html
    .replace(/\s*\r?\n\s*/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  const url = "data:text/html," + encodeURIComponent(compactHtml);

  console.log(url.length)

  if (url.length > 2000) {
    const counts = Object.entries(options ?? {})
      .map(([key, submitted]) => [key, String(submitted ?? "").length])
      .sort((a, b) => b[1] - a[1]);

    const detail = counts
      .map(([key, count]) => `${key}: ${count}`)
      .join(", ");

    throw new Error(
      `URL character count is ${url.length} (maximum 2000). ` +
      `Submitted context character counts, highest to lowest: ${detail}`
    );
  }

  return url;
}

async function renderAlert(options) {
  let location = {}
  let style = {}
  if (options.Origin) {
    location = { Target: options.Origin }
  }
  if (options.Target) {
    location = { Target: options.Target }
  }
  if (options.PeripheralId) {
    location = { PeripheralId: options.PeripheralId }
  }
  if (options.Mode){
    style = {Mode: options.Mode}
  }
  
  console.warn(options.Mode)
  await xapi.Command.UserInterface.WebView.Display({
    Url: options.Url,
    ...location,
    ...style
  })
}

xapi.Event.UserInterface.Extensions.Widget.Action.on(async event => {
  if (event.Type == 'released' && event.WidgetId.includes(`cad~`)) {
    const [app, action, data] = event.WidgetId.split(`~`);

    switch (action) {
      case 'openAlert':
        await renderAlert({
          Url: draftAlertHTML({
            Header: data,
            Title: data,
            Text: `Add some supporting text for ${data}`,
            BackgroundColor: data
          }),
          Target: 'Controller',
          Mode: 'Modal'
        })
        break
    }
  }
})

function buildDemoUI(){
  xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: 'cad'
  }, `<Extensions>
  <Version>1.11</Version>
  <Panel>
    <Location>HomeScreenAndCallControls</Location>
    <Icon>Info</Icon>
    <Name>Custom Alert Demo</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>Select to Preview and Alert</Name>
      <Row>
        <Name>Row</Name>
        <Widget>
          <WidgetId>cad~openAlert~green</WidgetId>
          <Name>Green Alert 🟢</Name>
          <Type>Button</Type>
          <Options>size=4</Options>
        </Widget>
        <Widget>
          <WidgetId>cad~openAlert~yellow</WidgetId>
          <Name>Yellow Alert 🟡</Name>
          <Type>Button</Type>
          <Options>size=4</Options>
        </Widget>
        <Widget>
          <WidgetId>cad~openAlert~red</WidgetId>
          <Name>Red Alert 🔴</Name>
          <Type>Button</Type>
          <Options>size=4</Options>
        </Widget>
      </Row>
      <Options>hideRowNames=1</Options>
    </Page>
  </Panel>
</Extensions>
`)
}

async function init() {
  buildDemoUI();
}

init()