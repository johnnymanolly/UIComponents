var anonymousToken = "UEYzNUVERTI0Qw==";

var login = {
   redirectTarget: "/UIComponents/dashboardBuilder/index.html",
   expiry:5,
   loginTarget: "/UIComponents/dashboardBuilder/login.html",
   loginTemplateTarget: "/UIComponents/dashboardBuilder/loginTemplate.html",
   anonymousToken: anonymousToken
};

var wssConfig = ["wsClientProvider",function (wsClientProvider) {
  wsClientProvider.setToken(anonymousToken);
  wsClientProvider.setPublishChannel("requestChannel");
  wsClientProvider.setSubscribeChannel("responseChannel");
}];

var httpsConfig = ["httpClientProvider",function (httpClientProvider) {
  httpClientProvider.setBaseUrl("https://dashboard.scriptrapps.io");
  httpClientProvider.setToken(anonymousToken);
}]
