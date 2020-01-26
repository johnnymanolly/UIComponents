var wssConfig = ["wsClientProvider",function (wsClientProvider) {
  wsClientProvider.setToken(config.token);
  wsClientProvider.setPublishChannel(config.requestChannel);
  wsClientProvider.setSubscribeChannel(config.responseChannel);
}];

var httpsConfig = ["httpClientProvider",function (httpClientProvider) {
  httpClientProvider.setBaseUrl(config.domain);
  httpClientProvider.setToken(config.token);
}]