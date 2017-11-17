angular.module('DashboardBuilder').service(
  "scriptrService",
  function(httpClient, $cookies) {
    this.saveScript = function(data, api) {
        return httpClient.post("UIComponents/dashboardBuilder/backend/api/saveDashboard", data)
    }
    
    this.getScript = function(data) {
      return httpClient.post(
        "UIComponents/dashboardBuilder/backend/api/getDashboard", data)
    }
    
    this.loadDashboards = function(data) {
        return httpClient.get(
            "UIComponents/dashboardBuilder/backend/api/loadScripts", {});
    }
    
    this.deleteDashboard = function(data) {
         return httpClient
          .get("UIComponents/dashboardBuilder/backend/api/deleteDashboard", data)
    }
    
     this.renameDashboard = function(data) {
         return httpClient
          .get("UIComponents/dashboardBuilder/backend/api/renameDashboard", data)
    }
    
    this.getToken = function(){
       return $cookies.get("token") || null;
    }
});

angular
  .module('DashboardBuilder')
  .component(
  'dashboard',
  {
    bindings : {
      widgets: "<",
      dashboard: "<",
      treeSearchCriteria: "@",
      iconExpand: "@",
      iconCollapse: "@",
      loadTree: "<?",
      showTree: "<",
      devicesModel: "@"
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/dashboard.html',
    controller: function($scope, $rootScope, $timeout, $sce, $window, httpClient, wsClient, $cookies, common, config, $uibModal, scriptrService, $route, $routeParams, $q, _) {
      
      this.wsClient = wsClient;
      var self = this;
      self.acls;  
            
      this.$onInit = function() {
        self.showTree = (typeof this.showTree != 'undefined')? this.showTree : true,  
        self.loading = true;  
        self.showPanelMsg = false;  
          
        self.users = [{
          code : "anonymous",
          icon : "fa fa-group"    
        }];
          
        self.onACLChange = function(acls){
            self.acls = acls.join(";");
            var d = $q.defer(); 
            self.saveScript(null, null, true).then(
              function(data, response) {
                  console.log("success");
                  d.resolve(data, response);
              },
              function(err) {
                console.log("reject", err);
                d.reject(err);  
              });
             return d.promise; 
              
        }  
        
        this.urlParams = [];
        this.transport = angular.copy(config.transport);
        this.frmGlobalOptions = {
          "destroyStrategy" : "remove",
          "formDefaults": {"feedback": true}
        }
        
        this.initializeDashboard();
        
        this.schema =  angular.copy(config.script.schema)
        this.form =   angular.copy(config.script.form)
        this.model = {}
        
        this.isInIde =  ($routeParams.scriptrIdeRef) ? true :  false;
        
        var scriptName = $routeParams.scriptName;
        if(scriptName) {
          this.openEditor(scriptName);
        }
        
        this.slickConfig = {
            enabled: true,
            autoplay: true,
            draggable: false,
            autoplaySpeed: 3000,
            method: {},
            event: {
                beforeChange: function (event, slick, currentSlide, nextSlide) {
                },
                afterChange: function (event, slick, currentSlide, nextSlide) {
                }
            }/**,
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 3,
                infinite: true,
                dots: true
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
            // You can unslick at a given breakpoint now by adding:
            // settings: "unslick"
            // instead of a settings object
          ]**/
        };
        
        //Gidster Wall Options
        this.gridsterOptions = {
          defaultSizeY: 200,
          defaultSizeX:200,
          minRows: 1, // the minimum height of the grid, in rows
          maxRows: 100,
          columns: 5, // the width of the grid, in columns
          colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
          rowHeight: 'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
          margins: [10, 10], // the pixel distance between each widget
          defaultSizeX: 2, // the default width of a gridster item, if not specifed
          defaultSizeY: 1, // the default height of a gridster item, if not specified
          mobileBreakPoint: 480, // if the screen is not wider that this, remove the grid layout and stack the items
          minColumns: 1, // the minimum columns the grid must have
          //MFE: overriden in each item widget definition
          //minSizeX: 1, // minimum column width of an item
         // maxSizeX: null, // maximum column width of an item
         // minSizeY: 2, // minumum row height of an item
          //maxSizeY: 2, // maximum row height of an item
            sparse: true,
          resizable: {
            enabled: true,
            handle: '.my-class', // optional selector for resize handle
            start: function(event, uiWidget, $element) {
                $(window).trigger('resize');
            	 //$scope.$broadcast("resize_widget", {wdg: uiWidget, element: $element})
            }, // optional callback fired when resize is started,
            resize: function(event, uiWidget, $element) {
                $(window).trigger('resize');
               //console.log("resize event called:",event, uiWidget, $element);
               // $scope.$broadcast("resize_widget", {wdg: uiWidget, element: $element})
            }, // optional callback fired when item is resized,
            stop: function(event, uiWidget, $element) {
              console.log("End resize:",event, uiWidget, $element);
               $timeout( function(){ $(window).trigger('resize')},100);
             // $scope.$broadcast("resize_widget", {wdg: uiWidget, element: $element})
              self.notifyDashboardChange();
            } //optional callback fired when item is finished resizing 
          },
          draggable: {
            enabled: true, // whether dragging items is supported
            handle: '.my-class', // optional selector for resize handle
            start: function(event, uiWidget, $element) {
                $(window).trigger('resize');
                //$scope.$broadcast("drag_widget", {wdg: uiWidget, element: $element})
            }, // optional callback fired when drag is started,
            drag: function(event, uiWidget, $element) {
                $(window).trigger('resize');
                //$scope.$broadcast("drag_widget", {wdg: uiWidget, element: $element})
            }, // optional callback fired when item is moved,
            stop: function(event, uiWidget, $element) {
              console.log("End drag", event, uiWidget, $element);
                $(window).trigger('resize');
                 self.notifyDashboardChange();
              //$scope.$broadcast("drag_widget", {wdg: uiWidget, element: $element})
            } // optional callback fired when item is finished dragging
          }
        };
          
        $scope.$watch('self.dashboard.widgets', function(items){
   console.log("one of the items changed")
}, true);
          
        $scope.$on('gridster-resized', function(event, sizes, gridster) { 
      	  console.log("gridster-resized");
          $(window).trigger('resize');     
        })
        
        $scope.$on('gridster-item-initialized', function(item) { 
      	  console.log("gridster-item-initialized");
      	  $(window).trigger('resize');
        })
        

        
        this.widgetsConfig = config.widgets; 
        this.widgetsCommon = common;
        this.dataLoaded = true;
        
      };
      
           //IDE CODE start
      this.$postLink = function() {
        
        var self = this;
        this.scriptrIdeRef = $routeParams.scriptrIdeRef;
        angular.element($window).on('message', function(event) {
            var msg = event.originalEvent.data;
            if(msg[0] == "get_editor_save_data-"+self.scriptrIdeRef) {
              	if($window.parent) {
                  $window.parent.postMessage([ "editor_save-" + self.scriptrIdeRef, self.getEditorValue()], "*");
                }
           }	
            if(msg[0] == "set_editor_load_data-"+self.scriptrIdeRef) {
              	self.setEditorValue(JSON.parse(msg[1]))
           }	
            		
        });
        
        if($window.parent) {
           $window.parent.postMessage([ "editor_loaded-" + this.scriptrIdeRef ], "*");
         }
      }
      
      this.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
      }
      this.addCustomDashboard = function(){
        this.showDashboard = true;
        self.savedScript = null;
        this.switchStatus = true;
        this.model.scriptName = null;
        self.isEdit = false;
        this.dashboard.widgets = [];
      }
      this.showCustomDashboard = function(scriptName){
        this.showDashboard = true;
        this.scriptName = scriptName;
        this.switchStatus = false;
        this.dashboardScriptName = "/" + this.scriptName;
        this.openEditor(scriptName);
      }
      this.homeCallback = function(data){
        if(data && data.documents){
          self.customDashboards = data.documents;
          if(data.documents.length == 0){
              self.noDashboards = true;
          }else{
              self.noDashboards = false;
          } 
        }else{
          console.log("No data found");
        }
      }
      this.deleteDashboard = function(path){
        console.log(name, path);
        var params = {
          "path" : path,
          "name" : name
        }

        self = this;
        httpClient
          .get("UIComponents/dashboardBuilder/backend/api/deleteDashboard", params)
          .then(
          function(data, response) {
            console.log("success");
      //      self.showMsg("success", "The dashboard has been deleted successfully.");
          },
          function(err) {
       //     self.showMsg("failure", err.data.response.metadata.errorDetail);   
            console
              .log(
              "reject published promise",
              err);
          });
      }
      
      this.deleteDashboardPopUp = function(path, name){
        var modalInstance = $uibModal.open({
               controller: 'PopupCont',
               templateUrl: '/UIComponents/dashboardBuilder/javascript/components/deletePopup.html',
               resolve: {
                   dashboard: function () {
                       return self;
                   },
                   path: function () {
                       return path;
                   },
                   name: function () {
                       return name;
                   }
               }
           });  
      }

      this.renameDashboard = function(newName, path){
          
         var array = path.split("/");
         var oldName = array[array.length - 1]; 
          
         if(oldName != newName) {
             console.log(name, path);
            var params = {
              "path" : path,
              "newName" : newName
            }
            var self = this;
            httpClient
              .get("UIComponents/dashboardBuilder/backend/api/renameDashboard", params)
              .then(
              function(data, response) {
                if(data == "success"){
                    console.log("success");
                    self.showMsg("success", "The dashboard has been renamed successfully.");
                }else{
                    if(data && data.errorDetail){
                        self.showMsg("danger", data.errorDetail);
                    }else{
                        self.showMsg("danger", "An error has occured");
                    }
                }
              },
              function(err) {
                self.showMsg("danger", err.data.response.metadata.errorDetail);
                console
                  .log(
                  "reject published promise",
                  err);
              });
         }
          
      }
      
      this.viewDasboard = function() {
         if(this.savedScript){
              $window.open("/"+this.savedScript); 
         }else{
             self.showAlert("danger", "Please save your dashboard before viewing it");
         }
      };
      
      this.closeAlert = function() {
         this.show = false;
      };
      
      this.showAlert = function(type, content) {
         this.closeAlert();
         this.message = {
           "type": type,
           "content": content
         }
         this.show = true
      }
      
      this.closeMsg = function() {
          this.showPanelMsg = false;
      };

      this.showMsg = function(type, content) {
          this.closeMsg(); 
          this.message = {
              "type": type,
              "content": content
          }
          this.showPanelMsg = true;
      }
      
      this.getEditorValue = function() {
          var data = {};
          data["items"] = angular.copy(this.dashboard.widgets);
          data["urlParams"] = angular.copy(this.urlParams);
          data["transport"] = angular.copy(this.transport.defaults);
          data["staticdomain"] = $routeParams.staticdomain;
          var template = this.unsafe_tags(document.querySelector('#handlebar-template').innerHTML);
          var unescapedHtml = Handlebars.compile(template)(data);
          var scriptData = {}
          scriptData["content"] = unescapedHtml;
          scriptData["pluginData"] = JSON.stringify({"wdg": data["items"], "urlParams": data["urlParams"], "settings": data["transport"]});
          return scriptData;
      };
        

       this.setEditorValue = function(pluginData) {
         if(pluginData) {
             this.widgets = pluginData.wdg; //This needs fixing
             this.urlParams = pluginData.urlParams;
             this.transport.defaults = pluginData.settings;
             this.dashboard["widgets"] = this.widgets;
         }
       }
       
       this.notifyDashboardChange = function() {
         if($window.parent) {
             $window.parent.postMessage([ "editor_data_changed-" + this.scriptrIdeRef , this.getEditorValue()], "*");
           }
       }
      //IDEC CODE end 
       
      this.openEditor = function(scriptName){
        this.model = {"scriptName": scriptName};
        var self = this;
        scriptrService.getScript(this.model).then(
          function(data, response) {
            self.postLoadScript(scriptName, data);
          }, function(err) {
            console.error("reject", err);
          });
      }
      
      this.selectBranch = function(branch) {
         console.log("Clicked branch data", branch);
        //Get clicked item Name
        var itemLabel = branch.label
        //Check if it has a ui representation
        
        if(branch[itemLabel] && branch[itemLabel].widget && branch[itemLabel].widget.type) {
          var dmWdg = branch[itemLabel].widget;
          var wdg = _.findWhere(config.widgets, {"name": dmWdg.type});
          console.log("Widget is", wdg);
          
          if(!wdg) {
              wdg = _.findWhere(config.widgets, {"name": config.defaultWidget.name});
          }
          
          var form = angular.copy(wdg.form);
          var schema =  angular.copy(wdg.schema);
         
          if(wdg.commonData){
              form[0].tabs = angular.copy([common.formTab].concat(wdg.form[0].tabs))
              schema.properties = merge_options(wdg.schema.properties,common.schemaFields); 
          }  
            
          var defApiParamsCount = 0;
          if(dmWdg["default-api-params"]){
            defApiParamsCount = Object.keys(dmWdg["default-api-params"]).length;
          }

          var defaults = {};
          _.each(dmWdg, function(value, key) {
            defaults[key] = value;
          });

          //MFE: TO REVIEW BIG TIME
          var apiParamsOutput = "{";
          if(dmWdg["api-params-name"]) {
            _.each(dmWdg["api-params-name"], function(item, index) {
              self.urlParams =  self.urlParams.concat([item]);
              apiParamsOutput += "\""+item+"\": vm."+ item + ((index < dmWdg["api-params-name"].length -1 || defApiParamsCount > 0) ? "," : "");
            });
          }

          if(dmWdg["default-api-params"]) {
            var cnt = 0;
            _.each(dmWdg["default-api-params"], function(value, key) {
              self.urlParams =  self.urlParams.concat([key]);
              apiParamsOutput += "\""+key+"\": \""+ value + ((cnt < defApiParamsCount -1) ? "\"," : "\"");
              cnt++;
            });
            apiParamsOutput +="}";
          } else {
            apiParamsOutput +="}";
          }
          console.log("apiParamsOutput",apiParamsOutput )
          // self.urlParams =  self.urlParams.concat(Object.keys(dmWdg["api-params"]));
          defaults["api-params"] =  apiParamsOutput; 
          //, "msg-tag": dmWdg["msg-tag"]}

          self.dashboard.widgets.push({
            "name":  branch.label,
            "sizeX": (wdg.box && wdg.box.sizeX) ? wdg.box.sizeX : 2,
            "sizeY": (wdg.box && wdg.box.sizeY) ? wdg.box.sizeY : 2,
            "minSizeX": (wdg.box && wdg.box.minSizeX) ? wdg.box.minSizeX : 2, // minimum column width of an item
            "maxSizeX": (wdg.box && wdg.box.maxSizeX) ? wdg.box.maxSizeX : null, // maximum column width of an item
            "minSizeY": (wdg.box && wdg.box.minSizeY) ? wdg.box.minSizeY : 2, // minumum row height of an item
            "maxSizeY": (wdg.box && wdg.box.maxSizeY) ? wdg.box.maxSizeY : null,
            "label": wdg.label,
            "type": wdg.class,
            "options": angular.extend(angular.copy(wdg.defaults), angular.copy(defaults)),
            "schema": schema,
            "form": form
          });
          self.notifyDashboardChange();
        } else {
          //self.showAlert("warning", "Device model attribute \""+ itemLabel + "\" has a no widget representation.")
          return;
        };
      }
      
      this.initializeDashboard =  function() {
          this.dashboard = { widgets: [] };
          if(this.widgets) {
            this.dashboard["widgets"] = this.widgets
          }
      };
      
      this.clear = function() {
      	var self = this;
         var modalInstance = $uibModal.open({
              animation: true,
              component: 'confirmationModal',
        		  size: 'md',
           	  scope: $scope,
               resolve: {
                 data: function () {
                   return {"title": "Clear Board", "body": "Are you sure you want to empty your dashboard?"};
                 }
               }
             });
             modalInstance.result.then(function (wdgModel) {
               if(wdgModel) {
                  self.clearWidgets();
               } 
             }, function () {
                console.info('modal-component for clearing dashboard update dismissed at: ' + new Date());
             });
			
	  };
	  
	  this.clearWidgets = function() {
		  this.dashboard.widgets = [];
        this.notifyDashboardChange();
	  };
      
      this.logout = function() {
        var authorization  = $.scriptr.authorization({loginPage: login.loginTarget});
		  authorization.logout();
	  };
        
      /**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
 var merge_options = function(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

      this.addWidget = function(wdg) {
          
          var form = angular.copy(wdg.form);
          var schema =  angular.copy(wdg.schema);
         
          if(wdg.commonData){
              form[0].tabs = angular.copy([common.formTab].concat(wdg.form[0].tabs))
              schema.properties =  merge_options(wdg.schema.properties,common.schemaFields); 
          }
  
          this.dashboard.widgets.push({
            "name": "New Widget",
            "sizeX": (wdg.box && wdg.box.sizeX) ? wdg.box.sizeX : 2,
            "sizeY": (wdg.box && wdg.box.sizeY) ? wdg.box.sizeY : 2,
            "minSizeX": (wdg.box && wdg.box.minSizeX) ? wdg.box.minSizeX : 2, // minimum column width of an item
            "maxSizeX": (wdg.box && wdg.box.maxSizeX) ? wdg.box.maxSizeX : null, // maximum column width of an item
            "minSizeY": (wdg.box && wdg.box.minSizeY) ? wdg.box.minSizeY : 2, // minumum row height of an item
            "maxSizeY": (wdg.box && wdg.box.maxSizeY) ? wdg.box.maxSizeY : null,
            "label": wdg.label,
            "type": wdg.class,
            "options": wdg.defaults,
            "schema": schema,
            "form": form
          });
          this.notifyDashboardChange();
      };
      
      this.setTransportSettings = function(redirectTarget) {
        var self = this;
        var modalInstance = $uibModal.open({
              animation: true,
              component: 'modalComponent',
       		  size: 'lg',
              resolve: {
                widget: function () {
                  return {
                    "label":  self.transport.label,
                    "options": self.transport.defaults,
                    "schema": self.transport.schema,
                    "form": self.transport.form};
                }
              }
            });
            modalInstance.result.then(function (transportModel) {
              console.log("modal-component transport settings data :", transportModel ,"submitted at: " + new Date());
              if(transportModel != "cancel") {
                if(self.transport.defaults && self.transport.defaults.publishChannel != transportModel.publishChannel){
                    self.wsClient.updatePublishingChannel(transportModel.publishChannel);
                }
                if(self.transport.defaults && self.transport.defaults.subscribeChannel != transportModel.subscribeChannel){
                  	self.wsClient.updateSubscriptionChannel(transportModel.subscribeChannel);
                } 
                self.transport.defaults = angular.copy(transportModel);
                self.notifyDashboardChange();
              }
            }, function () {
              console.log('modal-component transport settings dismissed at: ' + new Date());
            });
      };
      
      this.saveDashboard = function(form, custom, aclEvent) {
		console.log("Form submit", form)
        var self = this;
        $scope.$broadcast('schemaFormValidate');

        // Then we check if the form is valid
        if ((form && form.$valid) || aclEvent) {
          var data = {};
          data["items"] = angular.copy(this.dashboard.widgets);
          data["urlParams"] = angular.copy(this.urlParams);
          data["token"] = scriptrService.getToken();
         // console.log(JSON.stringify(data["items"]));
          self.transport.defaults.redirectTarget = this.model.scriptName;
          data["transport"] = angular.copy(this.transport.defaults) //MFE: Transport info needs to be retrieved from url or cookie
          var template = this.unsafe_tags(document.querySelector('#handlebar-template').innerHTML);
          var unescapedHtml = Handlebars.compile(template)(data);
          var scriptData = {}
          scriptData["content"] = unescapedHtml;
          scriptData["scriptName"] =  this.model.scriptName;
          scriptData["pluginData"] = JSON.stringify({"wdg": data["items"], "urlParams": data["urlParams"], "settings": data["transport"]});
          if(self.isEdit) {
            scriptData["update"] = true;
          }
          if(self.savedScript) {
            scriptData["previousScriptName"]  = self.savedScript;
          }
          //scriptData["custom"] = this.custom; //TODO MFE: Removed, need to check backend
          scriptData["acls"] = this.acls;  
          var d = $q.defer();  
          scriptrService.saveScript(scriptData).then(
            function(data, response) {
               console.log("resolve", data)
               if(data.status == "failure") {
                  self.showAlert("danger", data.errorDetail);
               } else {
                 self.isEdit = true;
                 self.savedScript = scriptData["scriptName"];
                 self.showAlert("success", "The dashboard has been saved successfully.");
                 d.resolve(data, response);  
               }
               
            }, function(err) {
              self.showAlert("danger", err.data.response.metadata.errorDetail);
              console.log("reject", err.data.response.metadata.errorDetail);
              d.reject(err);  
		  });
          return d.promise;   
          //Save data to scriptr
          console.log();        
        }
      }
     
      this.setACLs = function(data){
          this.acls = data.ACL.execute;
          var array = this.acls.split(";");
          this.users = [];  
          for(var i = 0; i < array.length; i++){
              var obj = {};
              obj["code"] = array[i];
              this.users.push(obj);
          }    
      } 
      
     this.postLoadScript = function(scriptName, data) {
       	 var userConfigRegex = /\/\*#\*SCRIPTR_PLUGIN\*#\*(.*\n?.*)\*#\*#\*\//;
     	 if(data) {
           var userConfig = data.userConfig;
           var matches = userConfig.match(userConfigRegex);
           if(userConfig && matches) {
             var pluginContent = JSON.parse(matches[1]);
             if(pluginContent && pluginContent.metadata &&  pluginContent.metadata.name == "DashboardBuilder"){
               this.widgets = JSON.parse(pluginContent.metadata.plugindata).wdg; //This needs fixing
               this.urlParams = JSON.parse(pluginContent.metadata.plugindata).urlParams;
               this.transport.defaults = JSON.parse(pluginContent.metadata.plugindata).settings;
               this.dashboard["widgets"] = this.widgets;
               this.isEdit = true;
               this.savedScript = scriptName;
               this.setACLs(data);  
             } else {
               this.showAlert("danger", "Invalid dashboard script. Pass another script.")
               console.error("Invalid dashboard script. Pass another script.")
             }
           } else {
             this.showAlert("danger", "Invalid dashboard script. Pass another script.")
             console.error("Invalid dashboard script. Pass another script.")
           }
         } else {
           this.showAlert("danger", "Invalid dashboard script. Pass another script.")
           console.error("Invalid dashboard script. Pass another script.")
         }
       console.debug("resolve get script "+scriptName+ " :", data) 
     }
      
     this.safe_tags= function(str) {
	    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
	};
	
	this.unsafe_tags= function(str) {
		 return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g,">").replace(/&quot;/g,"\"")
	};
    }
  });
angular
  .module('DashboardBuilder').component(
  'box',
  {
    require: {
      parent: '^^dashboard'
    },
    bindings : {
      "widget": "<"
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/box.html',
    controller: function($scope, $compile, $element, $uibModal) {
      
      var boxSelf = this;
     
      this.remove = function(widget) {
      	var self = this;
      	
      	var modalInstance = $uibModal.open({
            animation: true,
            component: 'confirmationModal',
      		  size: 'md',
         	  scope: $scope,
             resolve: {
               data: function () {
                 return {"title": "Remove Widget", "body": "Are you sure you want to remove widget from dashboard?"};
               }
             }
           });
           modalInstance.result.then(function (wdgModel) {
             if(wdgModel) {
                self.removeWidget(widget);
             } 
           }, function () {
              console.info('modal-component for removing widget dismissed at: ' + new Date());
           });
      	
      };
      
      this.removeWidget = function(widget) {
        this.parent.dashboard.widgets.splice(this.parent.dashboard.widgets.indexOf(widget), 1);
        this.parent.notifyDashboardChange();
      };
      
    
            
      this.$onInit =  function() {
          
                  $scope.$on('gridster-item-transition-end', function(item) { 
         console.log("gridster-item-transition end");
         $(window).trigger('resize');
        })
        
        $scope.$on('gridster-item-resized', function(item) {
		 	console.log("gridster-item-resized");
         	$(window).trigger('resize');
        })
        var self = this;
        if(this.widget) {
          this.addWidget(this.widget)
        }
        
        
        
        
        $scope.$on("resize_widget", function(event, data) {
          	console.log("Widget resize", event, data);
          	$(window).trigger('resize');
            if(self.widget == data.element) {
                if(self.widget.type == "scriptr-grid") {
                    var h = data.wdg.height();
                    data.element.options["grid-height"] = h - 110;
                    self.updateWidget(data.element.options)
                }
            }
            boxSelf.parent.notifyDashboardChange();
        });
        
         $scope.$on("drag_widget", function(event, data) {
		      console.log("Widget dragged", event, data);
             //$(window).trigger('resize');
              boxSelf.parent.notifyDashboardChange();
        });
        
       /**
        $scope.$on("update_widget", function(event, data) {
          console.log("Widget update", event, data);
          self.updateWidget(event, data)
        })**/
      };
      
      this.openSettings = function() {
        var self = this;
        var modalInstance = $uibModal.open({
              animation: true,
              component: 'modalComponent',
       		  size: 'lg',
          	  scope: $scope,
              resolve: {
                widget: function () {
                  return self.widget;
                }
              }
            });
            modalInstance.result.then(function (wdgModel) {
              if(wdgModel != "cancel") {
                 self.updateWidget(wdgModel)
              } 
            }, function () {
               console.info('modal-component for widget update dismissed at: ' + new Date());
            });
      };
      
      this.addWidget = function(widget) {
        var self = this;
        this.chart = angular.element(document.createElement(widget.type));
        
        angular.forEach(widget.options, function(value, key) {
         if(angular.isArray(value) || angular.isObject(value)){
             self.chart.attr(key, JSON.stringify(value));
         } else {
             self.chart.attr(key, value);
         }
        }, this);
        
        var el = $compile( this.chart )( $scope );
        
        angular.element($element.find(".box-content")).append( el );
        
        /**$scope.$watch('widget', function() {
          $compile( self.chart )( $scope );
        }, true)**/
      };
      
      this.updateWidget =  function(/**event, **/wdgModel) {
        var self = this;

        angular.forEach(wdgModel, function(value, key) {
           if(angular.isArray(value) || angular.isObject(value)){
             self.chart.attr(key, JSON.stringify(value));
         } else {
             self.chart.attr(key, value);
         }
        }, this);
        
        var mdl = angular.copy(wdgModel);
        
        var _current = this.parent.dashboard.widgets.indexOf(this.widget)
        var _new = angular.copy(this.widget);
        _new["options"] = angular.copy(mdl);
        //this.parent.dashboard.widgets[this.parent.dashboard.widgets.indexOf(this.widget)]["options"] = 
        this.parent.dashboard.widgets.splice(_current, 1, _new);
        this.parent.notifyDashboardChange();
      // $compile( self.chart )( $scope );
          
       
      };
    }
})

// Please note that the close and dismiss bindings are from $uibModalInstance.

angular
  .module('DashboardBuilder')
  .component('modalComponent', 
  {
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/myModalContent.html',
    controller: function ($scope) {
      this.$onInit = function () {
        this.widget = this.resolve.widget;
        
        $scope.$broadcast('schemaFormRedraw')
       
        this.frmGlobalOptions = {
          "destroyStrategy" : "remove",
          "formDefaults": {"feedback": false}
        }

        if(this.widget) {
            if(this.widget.schema) {
              this.schema =  angular.copy(this.widget.schema)
            } 
            if(this.widget.form) {
               this.form =   angular.copy(this.widget.form)
            }
            
              this.model =  (this.widget.options) ?  angular.copy(this.widget.options) : {}
          }
      };

      this.onSubmit = function(form) {
        // First we broadcast an event so all fields validate themselves
        $scope.$broadcast('schemaFormValidate');
        console.log(this.model)

        // Then we check if the form is valid
        if (form.$valid) {
          //angular.extend(this.widget.options, this.model);
          this.close({$value: this.model});
          //do whatever you need to do with your data.
          //$scope.$emit('update_widget', {"model":  this.model});
          console.log("component_form_parent", this.model)
        } 
      };

      this.onCancel = function (myForm) {
        this.schema = {};
        this.form = {}
        this.model = angular.copy(this.widget.options);
        this.dismiss({$value: 'cancel'});
        console.log("Dissmissed")
      };

    }
});

angular
  .module('DashboardBuilder')
  .component('sidetoolbar', 
  {
  	bindings: {
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/sideToolbar.html',
    controller: function ($scope, $mdSidenav) {
      this.close = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('left').close()
          .then(function () {
            console.debug("close LEFT is done");
          });

      };
    }
});


angular
  .module('DashboardBuilder')
  .component('confirmationModal', 
  {
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    templateUrl: '/UIComponents/dashboardBuilder/javascript/components/confirmation.html',
    controller: function ($scope) {
      this.$onInit = function () {
        this.data = this.resolve.data;
      };

      this.onSubmit = function() {
          this.close({$value: true});
      };
      this.onCancel = function () {
        this.dismiss({$value: false});
      };

    }
});
