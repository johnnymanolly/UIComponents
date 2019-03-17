var wssConfig = ["wsClientProvider",function (wsClientProvider) {
  wsClientProvider.setToken("QzFBQzlGQTQ4MTpzY3JpcHRyOkY3MkEzRkVBRUMwNzE3RUE5RDk4RjM3MkNDOUI3N0Qx");
  wsClientProvider.setPublishChannel("requestChannel");
  wsClientProvider.setSubscribeChannel("responseChannel");
}];

var httpsConfig = ["httpClientProvider",function (httpClientProvider) {
  httpClientProvider.setBaseUrl("https://estia.scriptrapps.io");
  httpClientProvider.setToken("QzFBQzlGQTQ4MTpzY3JpcHRyOkY3MkEzRkVBRUMwNzE3RUE5RDk4RjM3MkNDOUI3N0Qx");
}]