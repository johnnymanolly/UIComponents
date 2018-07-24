angular
      .module('HttpClient', [ 'ngCookies' ])
      .provider(
      		'httpClient',
            function httpClientProvider() {
                var _baseUrl = "";
	            var _token = null;
	            var _restUrl = "";
                var _type = "device";

	            this.setBaseUrl = function(textString) {
		            _baseUrl = textString;
		            console.log(_baseUrl)
	            };

	            this.setToken = function(textString) {
		            _token = textString;
		            console.log(_token)
	            };
                
                this.setType = function(textString) {
		            _type = textString;
		            console.log(_token)
	            };

	            var _buildUrl = function(scriptName) {
		            _restUrl = _baseUrl + "/" + scriptName;
		            console.log(_restUrl)
	            };

	            this.$get = [
	                  "$cookies",
	                  "$q",
	                  "$http",
	                  function wsFactory($cookies, $q, $http) {
                          if(_type == "user"){
                              if ($cookies.get("user_token")) {
                                  _token = $cookies.get("user_token");
                              }
                          }else{
                              if ($cookies.get("device_token")) {
                                  _token = $cookies.get("device_token");
                              }
                          }
		                 

		                  var setDefaultObject = function(obj, key, value) {
			                  if (!obj || !obj[key]) {
				                  if (!obj) {
					                  obj = {};
				                  }
				                  obj[key] = value;
			                  }
			                  return obj;
		                  }

		                  var httpRequest = function(scriptName, config, url, token) {

			                  var d = $q.defer();
			                  // Build base rest Url
			                  _buildUrl(scriptName);
							  
                              if(url){
                                config["url"] = url;  
                              }else{
                                  config["url"] = _restUrl;
                              }

                              if(token) {
                                  config["headers"] = setDefaultObject(
			                        config["headers"], "Authorization", "key="
			                              + token);
                              }else if(_token){
                                   config["headers"] = setDefaultObject(
			                        config["headers"], "Authorization", "Bearer "
			                              + _token);
                              }
			                  

			                  $http(config)
			                        .then(
			                              function(response) {
				                              if (response.data
				                                    && response.data.response) {
					                              var data = response.data.response;
					                              if (data.metadata.statusCode == "200"
					                                    && data.metadata.status == "success") {
						                              if (data.result
						                                    && data.result.metadata) {
							                              // Check for nested scriptr response
							                              if (data.result.statusCode == "200"
							                                    && data.result.status == "success") {
								                              d.resolve(
								                                    data.result.result,
								                                    response);
							                              } else {
								                              d
								                                    .reject(
								                                          data.result.metadata,
								                                          response);
							                              }
						                              } else {// No Nested scriptr response
							                              d.resolve(data.result,
							                                    response);
						                              }
					                              } else {// Not a success, logical failure
						                              d.reject(data.metadata,
						                                    response);
					                              }
				                              }else{
                                                   d.resolve(response.data, response)
                                              }
			                              }, function(err) {
				                              d.reject(err);
			                              });
			                  return d.promise;
		                  };

		                  var methods = {
		                     get : function(scriptName, params) {
			                     var config = {
				                     "method" : "GET"
			                     };
			                     config.params = params;
			                     return httpRequest(scriptName, config);
		                     },

		                     post : function(scriptName, data, headers,  url, token) {
			                     var config = {
				                     "method" : "POST"
			                     };
			                     config["data"] = data;

			                     if (headers) {
				                     config["headers"] = headers;
			                     }

			                     config["headers"] = setDefaultObject(config["headers"], "Content-Type","application/json");

			                     return httpRequest(scriptName, config,  url, token);
		                     }
		                  };
		                  return methods;
	                  }];
            });
