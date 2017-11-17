var wssConfig = ["wsClientProvider",function (wsClientProvider) {
  wsClientProvider.setToken("UEYzNUVERTI0QzpzY3JpcHRyOkQ1MUE2ODI5ODNDNkQxQkFDNTNDNzlGRjZDRDNDNzc3");
  wsClientProvider.setPublishChannel("requestChannel");
  wsClientProvider.setSubscribeChannel("responseChannel");
}];

var httpsConfig = ["httpClientProvider",function (httpClientProvider) {
  httpClientProvider.setBaseUrl("https://dashboard.scriptrapps.io");
  httpClientProvider.setToken("UEYzNUVERTI0QzpzY3JpcHRyOkQ1MUE2ODI5ODNDNkQxQkFDNTNDNzlGRjZDRDNDNzc3");
}]