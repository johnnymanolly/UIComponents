agGrid.initialiseAgGridWithAngular1(angular);
angular.module('Grid', ['agGrid', 'ui.bootstrap']);

angular
    .module("Grid")
    .component(
        'scriptrGrid',
        {
            bindings : {

                "user": "<?",

                "enableImport": "<?",

                "enableExport": "<?",
                
                "onAddRowClick" : "&",

                "exportFileName": "@",

                "admin" : "@",

                "onLoad" : "&onLoad",

                "deleteLabel": "@",

                "addLabel": "@",

                "columnsDefinition" : "<columnsDefinition",

                "cellEditorParams": "<?",

                "cellEditor": "@",

                "rowHeight": "<?",

                "enableServerSideSorting" : "<?", // Note that Client side sorting & filtering does not make sense in virtual paging and is just not supported, only Server side sorting & filtering is supported

                "enableServerSideFilter" : "<?",

                "enableColResize" : "<?",

                "pagination" : "@",

                "serverFilterLabel": "@",

                "enableDeleteRow" : "<?",

                "fixedHeight" : "<?",

                "enableAddRow" : "<?",

                "cellEditable" : "<?",

                "enableClientSideSorting": "<?", // client-side sorting

                "api" : "@", // restApi

                "onInsertRowScript" : "@",

                "onDeleteRowScript" : "@",

                "transport" : "@", //"http" or "wss" or "publish"

                "enableClientSideFilter" : "<?",

                "rowModelType" : "@", // rowModelType can be set to "pagination" or "virtual" (infinite scrolling)

                "rowModelSelection" : "@", //"multiple" or "single"

                "rowDeselection" : "<?",

                "onSelectionChanged": "&?",

                "rowData" : "<?",

                "suppressFilter": "<?",

                "gridHeight" : "@",

                /** pagination properties **/
                "paginationPageSize" : "<?", // In virtual paging context means how big each page in our page cache will be, default is 100

                /** virtual paging properties **/
                "paginationOverflowSize" : "<?", // how many extra blank rows to display to the user at the end of the dataset, which sets the vertical scroll and then allows the grid to request viewing more rows of data. default is 1, ie show 1 row.

                /** virtual paging properties **/
                "maxConcurrentDatasourceRequests" : "<?", // how many server side requests to send at a time. if user is scrolling lots, then the requests are throttled down

                /** virtual paging properties **/
                "paginationInitialRowCount" : "<?",// how many rows to initially show in the grid. having 1 shows a blank row, so it looks like the grid is loading from the users perspective (as we have a spinner in the first col)

                /** virtual paging properties **/
                "maxPagesInCache" : "<?", // how many pages to store in cache. default is undefined, which allows an infinite sized cache, pages are never purged. this should be set for large data to stop your browser from getting full of data
                "apiParams" : "<?",

                "deleteParams": "<?",

                "addParams": "<?",

                "editParams": "<?",

                "autoRefresh" : "<?",

                "onFormatData" : "&",

                "onCellValueChanged" : "&",

                "onCellClicked" : "&",

                "onAddRow" :"&",

                "msgTag" : "@",

                "class" : "@",

                "allowToEdit": "<?",
                
                "exportExcludeFields": "<?",

                "defaultCellRenderer": "&",

                "onGridReady" : "&"
            },

            templateUrl : '/UIComponents/dashboard/frontend/components/grid/grid_new.html',
            controller : function($scope, $window, $uibModal, $interval, $timeout, httpClient, wsClient, gridService, $q) {

                var self = this;

                self.broadcastData = null;

                this.dataSource = {
                    getRows : function(params) {
                        if(self.broadcastData != null){
                            if(self.broadcastData.api != null){
                                var api = self.broadcastData.api
                            }else{
                                var api = self.api
                            }
                            if(self.broadcastData.params != null){
                                self.apiParams = self.broadcastData.params
                                self.broadcastData.params = null;
                            }
                            if(self.broadcastData.transport != null){
                                var transport = self.broadcastData.transport
                            }else{
                                var transport = self.transport
                            }
                        }else{
                            var api = self.api;
                            var apiParams = APIParams;
                            var transport = self.transport;
                        }
                        var APIParams = self.buildParams(params)
                        var tmp = null;
                        if(typeof self.onFormatData() == "function"){
                            tmp = function(data){
                                return self.onFormatData()(data); // Or we can have it as self.onFormatData({"data":data}) and pass it in the on-format-update as: vm.callback(data)
                            }
                        }
                        if(self.user){
                            APIParams["user"] = self.user.login;
                        }
                        self.startRow = APIParams.startRow;
                        self.endRow = APIParams.endRow;
                        if(!self.dontShowLoading)
                        {
                            self.gridOptions.api.showLoadingOverlay();
                        }
                        gridService.getGridData(api, APIParams, transport, tmp).then(
                            function(data, response) {
                                if (data && data.documents) {
                                    self.gridOptions.api.hideOverlay();
                                    var rowsData = data.documents;
                                    var count = parseInt(data.count);

                                    var cleanedRows = self.cleanRows(rowsData);
                                    self.cleanedRows = cleanedRows;
                                    params.successCallback(cleanedRows, count);
                                    self.gridOptions.api.sizeColumnsToFit();                               

                                    // if there's no rows to be shown, disbale the next button
                                    if(cleanedRows == null || cleanedRows.length == 0){
                                        self.gridOptions.api.showNoRowsOverlay();
                                        var el = angular.element( document.querySelector( '#btNext' ) );
                                        el.attr('disabled', 'true');
                                    }
                                } else {
                                    if(self.gridOptions.rowModelType == "infinite"){
                                        self.gridOptions.api.showNoRowsOverlay();
                                        // self.gridOptions.api.hideOverlay();
                                    }else{
                                        self.gridOptions.api.hideOverlay();
                                        params.failCallback();
                                    }
                                }
                            }, function(err) {
                                console.log("reject", err);
                            });
                    }
                }

                 this.$onDestroy = function() {
                     if(self.msgTag){
                         wsClient.unsubscribe(self.msgTag, null, $scope.$id);
                     }
                     console.log("destory Grid")
                 }

                this.cleanRows = function(rows){
                    if(!Array.isArray(rows)){
                        rows = [rows];
                    }
                    var fieldExist = false;
                    for(var i = 0; i < rows.length; i++){
                        for(row in rows[i]){
                       //     rows[i]["count"] = i+1;
                            if(row != "key"){
                                fieldExist = false;
                                for (var n = 0; n < self.gridOptions.columnDefs.length; n++){
                                    if(row == self.gridOptions.columnDefs[n].field){
                                        fieldExist = true;
                                        break;
                                    }
                                }
                                if(!fieldExist){
                                    delete rows[i][row];
                                }
                            }
                        }
                    }
                    return rows;
                }

                // Get data from backend
                this._createNewDatasource = function() {
                    this.gridOptions.api.setDatasource(this.dataSource);
                }

                this.$onInit = function() {
                    this.gridOptions = {
                        angularCompileRows: true,
                        rowHeight : (this.rowHeight) ? this.rowHeight : 25,
                        deleteLabel : (this.deleteLabel) ? this.deleteLabel : "",
                        addLabel : (this.addLabel) ? this.addLabel : "",
                        cellEditorParams: (this.cellEditorParams) ? this.cellEditorParams : null,                       
                        enableSorting: (typeof this.enableClientSideSorting != 'undefined')? this.enableClientSideSorting : true,
                        enableServerSideSorting : (typeof this.enableServerSideSorting != 'undefined')? this.enableServerSideSorting : true,
                        enableServerSideFilter : (typeof this.enableServerSideFilter != 'undefined') ? this.enableServerSideFilter : true,
                        enableColResize : (typeof this.enableColResize != 'undefined') ? this.enableColResize : false,
                        enableFilter : true,
                        columnDefs : this.columnsDefinition,
                    //    editType : 'fullRow',
                        pagination: (typeof this.pagination != "undefined") ? this.pagination : false,
                        cacheBlockSize: (this.paginationPageSize) ? this.paginationPageSize : 50,
                        rowData: (this.rowData)? this.rowData : null,
                        rowModelType : (this.api) ? "infinite" : "",
                        rowSelection : (this.rowModelSelection) ? this.rowModelSelection : "multiple",
                        paginationPageSize : (this.paginationPageSize) ? this.paginationPageSize : 50,
                        overlayLoadingTemplate: '<span class="ag-overlay-loading-center"><i class="fa fa-spinner fa-spin fa-fw fa-2x"></i> Please wait...</span>',
                        defaultColDef : {
                            filterParams : {
                                apply : true
                            },
                            cellEditorParams: {
                                maxLength: '5000',   // override the editor defaults
                                cols: '50',
                                rows: '6'
                            },
                            cellEditor: (this.cellEditor) ? this.cellEditor : null,
                            suppressFilter: (typeof this.suppressFilter != 'undefined')? this.suppressFilter : false,
                            editable : (typeof this.cellEditable != 'undefined')? this.cellEditable : true,
                            cellRenderer : (typeof this.defaultCellRenderer() == 'function')? this.defaultCellRenderer() : null
                        },
                        onSelectionChanged: function(event) {
                            if(self.onSelectionChanged != null && typeof self.onSelectionChanged() == "function"){
                                return self.onSelectionChanged()(self.gridOptions);
                            }
                        },
                        onCellClicked: function(event) {
                            if(self.onCellClicked != null && typeof self.onCellClicked() == "function"){
                                return self.onCellClicked()(event, self.gridOptions);
                            }
                        },
                        onRowValueChanged : function(event) { // used for adding/editing a row
                            //    self.oldEditedValue = event.oldValue;
                            //    self.editedColumn = event.colDef.field;
                            //    self.editedChildIndex = event.node.childIndex || event.node.id;
                            if(self.allowToEdit){
                                if(self.onCellValueChanged != null && typeof self.onCellValueChanged() == "function"){
                                    self.onCellValueChanged()(self.gridOptions);
                                }
                                if(self.gridOptions.rowModelType == "infinite"){
                                    if(self.api){
                                        self.gridOptions.api.showLoadingOverlay();
                                        self._saveData(event);
                                    }else{
                                        self.undoChanges();
                                        self.showAlert("danger", "No script defined for cell edit");
                                    }
                                }
                            }
                        },
                        onCellValueChanged : function(event) { // used for adding/editing a row
                            //    self.oldEditedValue = event.oldValue;
                            //    self.editedColumn = event.colDef.field;
                            //    self.editedChildIndex = event.node.childIndex || event.node.id;
                            if(self.allowToEdit){
                                if(self.onCellValueChanged != null && typeof self.onCellValueChanged() == "function"){
                                    self.onCellValueChanged()(self.gridOptions);
                                }
                                if(self.gridOptions.rowModelType == "infinite"){
                                    if(self.api){
                                        self.gridOptions.api.showLoadingOverlay();
                                        self._saveData(event);
                                    }else{
                                        self.undoChanges();
                                        self.showAlert("danger", "No script defined for cell edit");
                                    }
                                }
                            }
                        },
                        onGridReady : function(event) {
                            console.log('the grid is now ready');
                            $(document).ready(function() {
                              $(window).keydown(function(event){
                                if(event.keyCode == 13) {
                                  event.preventDefault();
                                  return false;
                                }
                              });
                            });
                            $timeout(function() {
                                self.gridOptions.api = event.api;
                                self.gridApi = event.api;
                                if(typeof self.rowData == 'undefined' || self.rowData == null || (self.rowData && self.rowData.length ==0)){
                                    if(self.api){
                                        self._createNewDatasource();
                                    }else{
                                        event.api.setRowData([]);
                                    }
                                }else{
                                    event.api.sizeColumnsToFit();
                                }
                            }, 1000)
                            if(typeof self.onGridReady() == "function"){
                                self.onGridReady()(self);
                            }
                            // set "Contains" in the column drop down filter to "StartWith" as it is not supported in document query
                       //     event.api.filterManager.availableFilters.text.CONTAINS = "startsWith";
                            /*
                            if(typeof self.rowData == 'undefined' || self.rowData == null || (self.rowData && self.rowData.length ==0)){
                                if(self.api){
                                    self._createNewDatasource();
                                }else{
                                    event.api.setRowData([]);
                                }
                            }else{
                                event.api.sizeColumnsToFit();
                            }
                            */
                            // set a numeric filter model for each numerical column
                            if(this.columnsDefinition){
                                for(var i = 0; i < this.columnsDefinition.length; i++){
                                    if(this.columnsDefinition[i].hasOwnProperty("type") && this.columnsDefinition[i]["type"] == "numeric"){
                                        this.columnsDefinition[i].filter = "number";
                                    }
                                }
                            }else{
                                //    self.gridOptions.api.showNoRowsOverlay();
                            }
                        },
                        onGridSizeChanged: function(event){
                            self.gridOptions.api.sizeColumnsToFit();
                        }

                    };
                    this.allowToEdit = (typeof this.allowToEdit != 'undefined') ?  this.allowToEdit : true,
                        this.user = (this.user) ?  this.user : "",
                        this.admin = (this.admin) ?  this.admin : "",
                        this.serverFilterLabel = (this.serverFilterLabel) ? this.serverFilterLabel : "Server filter";
                    this.fixedHeight = (typeof this.fixedHeight != 'undefined') ? this.fixedHeight : true;
                    this.style = {};
                    if(this.fixedHeight){
                        this.gridHeight = (this.gridHeight) ? this.gridHeight : "500";
                        this.style["height"] = this.gridHeight;
                        this.style["clear"] = "left";
                        this.style["width"] = "100%";
                    }else{
                        this.style["height"] = "77%";
                    }
                    this.transport = (this.transport) ? this.transport : "wss";
                    this.enableDeleteRow =  (this.enableDeleteRow == true) ? false : true;
                    this.showImport = false;
                    if(self.user){
                        var groups = self.user.groups;
                        if(typeof groups == "string"){
                            if(groups != self.admin){
                                this.enableDeleteRow = true;
                            }else{
                                this.showImport = true;
                            }
                        }
                        else{
                            if(!_.contains(groups, self.admin)){
                                this.enableDeleteRow = true;
                            } else{
                                this.showImport = true;
                            }
                        }

                    }
                    
                    this.exportExcludeFields =  (this.exportExcludeFields) ? this.exportExcludeFields : [];
                    this.enableAddRow =  (this.enableAddRow == true) ? false : true;
                    this.exportFileName =  (this.exportFileName) ? this.exportFileName : "export";
                    this.mode =  (this.gridOptions.rowModelType == 'infinite') ? "infinite" : "normal";

                    if(self.msgTag){
                        gridService.subscribe(this.onServerCall, self.msgTag, $scope);
                    }

                    if(self.autoRefresh)
                    {
                        self.autoRefreshGrid();
                    }

                    $scope.$on("updateGridData", function(event, broadcastData) {
                        self.broadcastData = broadcastData;
                        self._createNewDatasource();
                    })

                }

                this.closeAlert = function() {
                    this.show = false;
                };

                this.showAlert = function(type, content) {
                    self.message = {
                        "type" : type,
                        "content" : content
                    }
                    self.showError = true;
                    $timeout(function(){
                        self.showError = false;
                    }, 5000);
                }

                this._saveData = function(event){
                    var row = event.data;
                    if(event.data && event.data.key){
                        //        params.action = "edit";
                        if(this.editParams){
                            for(var key in this.editParams){
                                row[key] = this.editParams[key]
                            }
                        }
                        if(self.user){
                            row["user"] = self.user.login;
                        }
                        var params = {row: row, action: "edit"};
                        gridService.gridHelper(self.api, params, "https").then(
                            function(data, response) {
                                self.gridOptions.api.hideOverlay();
                                if (data && data.result == "success" || data.status == "success") {
                                    //       self.showAlert("success", "Row(s) updated successfuly");
                                    self.onServerCall();
                                } else {
                                    self.undoChanges();
                                    if(data && data.errorDetail){
                                        self.showAlert("danger", data.errorDetail);
                                    }else{
                                        self.showAlert("danger", "An error has occured");
                                    }
                                }
                            },
                            function(err) {
                                self.gridOptions.api.hideOverlay();
                                console.log("reject", err);
                                self.showAlert("danger", "An error has occured");
                            });
                    }else{
                        //      params.action = "add";
                        if(this.addParams){
                            for(var key in this.addParams){
                                row[key] = this.addParams[key]
                            }
                        }
                        if(self.user){
                            row["user"] = self.user.login;
                        }
                        var params = {row: event.data, action: "add"};
                        gridService.gridHelper(self.api, params, "https").then(
                            function(data, response) {
                                self.gridOptions.api.hideOverlay();
                                if (data && data.result == "success" || data.status == "success") {
                                    //	  self.showAlert("success", "Row(s) Added successfuly");
                                    self.onServerCall();

                                } else {
                                    self.undoChanges();
                                    if(data && data.errorDetail){
                                        self.showAlert("danger", data.errorDetail);
                                    }else{
                                        self.showAlert("danger", "An error has occured");
                                    }
                                }
                            },
                            function(err) {
                                self.gridOptions.api.hideOverlay();
                                console.log("reject", err);
                                self.showAlert("danger", "An error has occured");
                            });
                    }
                }

                this.onAddRow = function(){
                    if(typeof this.onAddRowClick() == "function")
                    {
                        this.onAddRowClick()(self);
                    }
                    else
                    {    
                        var newRow = {};
                        // Create a json object to save new row fields 
                        for (var n = 0; n < self.gridOptions.columnDefs.length; n++){
                            newRow[self.gridOptions.columnDefs[n].field] = "";
                        }
                        self.gridOptions.api.insertItemsAtIndex(0, [newRow]);
                        self.gridOptions.api.setFocusedCell(0, self.gridOptions.columnDefs[0].field);
                        self.gridOptions.api.startEditingCell({
                            rowIndex: 0,
                            colKey: self.gridOptions.columnDefs[0].field,
                            charPress: self.gridOptions.columnDefs[0].field
                        });
                    } 
                }

                this.openConfirmationPopUp = function(){
                    if(self.gridOptions.api.getSelectedNodes().length > 0){
                        var modalInstance = $uibModal.open({
                            animation: true,
                            component: 'deleteConfirmation',
                            size: 'md',
                            resolve: {
                                grid: function () {
                                    return self;
                                }
                            }
                        });
                    }
                }

                this.onRemoveRow = function(key) {
                    if(self.gridOptions.rowModelType == "infinite"){
                        if(self.api){
                            var selectedNodes = self.gridOptions.api.getSelectedNodes();
                            var selectedKeys = [];
                            for(var i = 0; i < selectedNodes.length; i++){
                                selectedKeys.push(selectedNodes[i].data.key);
                            }
                            if(selectedKeys.length > 0){
                                self.gridOptions.api.showLoadingOverlay();
                                var params = {keys : selectedKeys, action: "delete"}
                                if(this.deleteParams){
                                    for(var key in this.deleteParams){
                                        params[key] = this.deleteParams[key]
                                    }
                                }
                                gridService.gridHelper(self.api, params, "https").then(
                                    function(data, response) {
                                        self.gridOptions.api.hideOverlay();
                                        if (data && data.result == "success" || data.status == "success") {
                                            //     self.showAlert("success", "Row(s) deleted successfuly");
                                            self.onServerCall();
                                        } else {
                                            if(data && data.errorDetail){
                                                self.showAlert("danger", data.errorDetail);
                                            }else{
                                                self.showAlert("danger", "An error has occured");
                                            }
                                        }
                                    },
                                    function(err) {
                                        self.gridOptions.api.hideOverlay();
                                        console.log("reject", err);
                                        self.showAlert("danger", "An error has occured");
                                    });
                            }
                        }else{
                            self.showAlert("danger", "No script defined for delete row");
                        }
                    }else{
                        var selectedNodes = self.gridOptions.api.getSelectedNodes();
                        self.gridOptions.api.removeItems(selectedNodes);
                    }
                }

                this.autoRefreshGrid = function()
                {
                    if(!self.gridOptions.api) self.gridOptions.api = self.gridApi;
                    self.dontShowLoading = true;
                    
                    $interval(function () {
                        self.gridOptions.api.refreshInfiniteCache();
                    }, self.autoRefresh);
                }

                this.onServerCall = function(){
                    if(!self.gridOptions.api) self.gridOptions.api = self.gridApi;
                    self.gridOptions.api.refreshInfiniteCache();
                }

                this.stopEditing = function(){
                    self.gridOptions.api.stopEditing();
                }

                this.onUpload = function(data){
                    self.gridOptions.api.showLoadingOverlay();
                }

                this.onSuccess = function(data){
                    self.gridOptions.api.hideOverlay();
                    self.gridOptions.api.refreshInfiniteCache();
                }

                this.onError = function(response){
                    self.showAlert("danger", "An error has occurred");
                }

                this.undoChanges = function(data){
                    if(self.oldEditedValue){ // undo field rename
                        self.gridOptions.api.forEachNode(function(node) {
                            if (node.childIndex == self.editedChildIndex || node.id == self.editedChildIndex) {
                                node.setSelected(true, true);
                            }
                        });
                        var selectedNode = self.gridOptions.api.getSelectedNodes()[0];
                        selectedNode.data[self.editedColumn] = self.oldEditedValue;
                        self.gridOptions.api.refreshView();
                    }else{ // undo insert row
                        self.gridOptions.api.forEachNode(function(node) {
                            if(self.gridOptions.rowModelType == "pagination"){
                                if (node.childIndex == 0) {
                                    node.setSelected(true, true);
                                    var selectedNode = self.gridOptions.api.getSelectedNodes();
                                    self.gridOptions.api.removeItems(selectedNode);
                                }
                            }else{
                                self.gridOptions.api.refreshInfiniteCache();
                            }
                        });
                    }
                }

                this.onFilterChanged = function() {
                    this.gridOptions.enableServerSideFilter = false;
                    this.gridOptions.api.setQuickFilter(this.quickFilterValue);
                    this.gridOptions.enableServerSideFilter = true;
                }

                this.onServerFilterChanged = function() {
                    self.apiParams = null;
                    self._createNewDatasource();
                }

                this.buildParams = function(params) {
                    var queryFilter = self.serverFilterText;
                    //  var criteria = self.serverFilterText;
                    var columnName = null;
                    var type = null;
                    var pageNumber = params.endRow / this.gridOptions.paginationPageSize;
                    if (params.sortModel && params.sortModel.length > 0) {
                        var sort = params.sortModel[0].sort;
                        var sortingColumnName = params.sortModel[0].colId;
                        type = (this.gridOptions.api.getColumnDef(sortingColumnName).type) ? this.gridOptions.api.getColumnDef(sortingColumnName).type : null;
                    }
                    if (params.filterModel) {
                        for (p in params.filterModel) {
                            queryFilter = params.filterModel[p].filter;
                            var queryType = params.filterModel[p].type;
                            var filterColumnName = p;
                            type = (this.gridOptions.api
                                .getColumnDef(filterColumnName).type) ? this.gridOptions.api
                                    .getColumnDef(filterColumnName).type
                                : null;
                        }
                    }
                    var APIParams = {
                        "resultsPerPage" : this.gridOptions.paginationPageSize,
                        "pageNumber" : pageNumber
                    }
                    if (sortingColumnName) {
                        APIParams["sortingColumnName"] = sortingColumnName;
                    }
                    if (filterColumnName) {
                        APIParams["filterColumnName"] = filterColumnName;
                    }
                    if (sort) {
                        APIParams["sort"] = sort;
                    }
                    if (type) {
                        APIParams["sortType"] = type;
                    }
                    if (queryFilter) {
                        APIParams["queryFilter"] = queryFilter;
                    }
                    /*
                    if(criteria){
                        APIParams["criteria"] = criteria;
                    }
                    */
                    if (queryType) {
                        APIParams["queryType"] = queryType;
                    }

                    APIParams["startRow"] = (params.sortModel.length > 0) ? self.startRow : params.startRow;
                    APIParams["endRow"] = (params.sortModel.length > 0) ? self.endRow : params.endRow;
                    if(self.apiParams){
                        for(var param in this.apiParams){
                            APIParams[param] = self.apiParams[param];
                        }
                    }
                //    self.apiParams = null;
                    return APIParams;
                }

                // XMLHttpRequest in promise format
                function makeRequest(method, url, success, error) {
                    var httpRequest = new XMLHttpRequest();
                    httpRequest.open("GET", url, true);
                    httpRequest.responseType = "arraybuffer";

                    httpRequest.open(method, url);
                    httpRequest.onload = function () {
                        success(httpRequest.response);
                    };
                    httpRequest.onerror = function () {
                        error(httpRequest.response);
                    };
                    httpRequest.send();
                }

                // read the raw data and convert it to a XLSX workbook
                function convertDataToWorkbook(data) {
                    /* convert data to binary string */
                    var data = new Uint8Array(data);
                    var arr = new Array();

                    for (var i = 0; i !== data.length; ++i) {
                        arr[i] = String.fromCharCode(data[i]);
                    }

                    var bstr = arr.join("");

                    return XLSX.read(bstr, {type: "binary"});
                }

                // pull out the values we're after, converting it into an array of rowData

                function populateGrid(workbook) {

                    for(var x = 0; x < workbook.SheetNames.length; x++){
                        // our data is in the first sheet
                        var sheetName = workbook.SheetNames[x];
                        var worksheet = workbook.Sheets[sheetName];

                        // we expect the following columns to be present
                        var columns = {
                            'A': workbook.Sheets[workbook.SheetNames[x]].A1.v,
                            'B': workbook.Sheets[workbook.SheetNames[x]].B1.v,
                            'C': workbook.Sheets[workbook.SheetNames[x]].C1.v,
                            'D': workbook.Sheets[workbook.SheetNames[x]].D1.v,
                            'E': workbook.Sheets[workbook.SheetNames[x]].E1.v,
                            'F': workbook.Sheets[workbook.SheetNames[x]].F1.v,
                            'G': workbook.Sheets[workbook.SheetNames[x]].G1.v,
                            'H': workbook.Sheets[workbook.SheetNames[x]].H1.v,
                            'I': workbook.Sheets[workbook.SheetNames[x]].I1.v,
                        //    'J': workbook.Sheets[workbook.SheetNames[x]].J1.v,
                        //    'K': workbook.Sheets[workbook.SheetNames[x]].K1.v,
                        //    'L': workbook.Sheets[workbook.SheetNames[x]].L1.v,
                        //    'M': workbook.Sheets[workbook.SheetNames[x]].M1.v,
                        //    'N': workbook.Sheets[workbook.SheetNames[x]].N1.v
                        };

                        var rowData = [];

                        // start at the 2nd row - the first row are the headers
                        var rowIndex = 2;

                        // iterate over the worksheet pulling out the columns we're expecting
                        while (worksheet['A' + rowIndex]) {
                            var row = {};
                            Object.keys(columns).forEach(function(column) {
                                row[columns[column]] = (worksheet[column + rowIndex]) ? worksheet[column + rowIndex].w : "";
                            });

                            rowData.push(row);

                            rowIndex++;
                        }
                        if(!self.api){
                            self.gridOptions.api.setRowData(rowData);
                        }else{

                            var all_data = [];
                            var i,j,temparray,chunk = 50;
                            for (i=0,j=rowData.length; i<j; i+=chunk) {
                                temparray = rowData.slice(i,i+chunk);
                                all_data.push(temparray);
                            }
                            var index = 0;
                            callAgain(all_data[index], index, all_data);

                        }
                    }
                }

                function callAgain(rows, index, all_data){
                    saveImport(rows).then(
                        function(data, response) {
                            if (data && data.result == "success" || data.status == "success") {

                                index++;
                                if(index < all_data.length){
                                    $timeout(function () {
                                        callAgain(all_data[index], index, all_data);
                                    }, 4000);
                                }else{
                                    self.gridOptions.api.hideOverlay();
                                    self.onServerCall(data);
                                    $("#upload_csv").val('');
                                    self.showAlert("success", "The file is imported successfully");
                                }
                            }
                        },
                        function(err) {
                            self.gridOptions.api.hideOverlay();
                            self.showAlert("danger", "An error has occured");
                        });
                }

                function saveImport(rowData){
                    self.gridOptions.api.showLoadingOverlay();
                    var params = {rows: rowData, action: "import"};
                    if(self.user){
                        params["user"] = self.user.login;
                    }
                    var d = $q.defer();
                    httpClient
                        .post(self.api, params).then(function(data, response){
                        d.resolve(data, response)
                    }, function(err) {
                        d.reject(err)
                    });
                    return d.promise;
                }

                
                this.importExcelFromURL = function() {
                    makeRequest('GET',
                        'https://cdn.rawgit.com/johnnymanolly/resources/0c4909df/hycm/translations/hycm_translations.xlsx',
                        // success
                        function (data) {
                            var workbook = convertDataToWorkbook(data);

                            populateGrid(workbook);
                        },
                        // error
                        function (error) {
                            throw error;
                        }
                    );
                }          

                this.importExcel = function($scope) {

                   var files = document.getElementById("upload_csv").files;
                   var file;
                   if (!files || files.length == 0) return;
                   file = files[0];

                   var fileReader = new FileReader();

                   fileReader.onload = function (e) {
                      var filename = file.name;
                      // call 'xlsx' to read the file
                      var binary = "";
                      var bytes = new Uint8Array(e.target.result);
                      var length = bytes.byteLength;
                      for (var i = 0; i < length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                      }
                      var workbook = XLSX.read(binary, {type: 'binary', cellDates:true, cellStyles:true});
                      populateGrid(workbook);
                    };

                    fileReader.readAsArrayBuffer(file);

                    
                }


                function convertToCSV(objArray) {
                    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
                    var str = '';

                    for (var i = 0; i < array.length; i++) {
                        var line = '';
                        for (var index in array[i]) {
                            if (line != '') line += ','
                          //  line += ',';       
                            line += "\"" + array[i][index] + "\"";
                        }

                        str += line + '\r\n';
                    }

                    return str;
                }

                function exportCSVFile(headers, items, fileTitle) {
                    if (headers) {
                        items.unshift(headers);
                    }

                    // Convert Object to JSON
                    var jsonObject = JSON.stringify(items);

                    var csv = convertToCSV(jsonObject);

                    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

                    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    if (navigator.msSaveBlob) { // IE 10+
                        navigator.msSaveBlob(blob, exportedFilenmae);
                    } else {
                        var link = document.createElement("a");
                        if (link.download !== undefined) { // feature detection
                            // Browsers that support HTML5 download attribute
                            var url = URL.createObjectURL(blob);
                            link.setAttribute("href", url);
                            link.setAttribute("download", exportedFilenmae);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                }
                
                this.exportToExcel = function(all) {
                  
                  headers = {};
                  for(var i = 0; i < this.columnsDefinition.length; i++){
                      var item = this.columnsDefinition[i];
    				  if(item.field && !_.contains(self.exportExcludeFields, item.field))
                      {
                    //    headers[item['field']] = item['headerName']
                        headers[item['field']] = item['field']
                      }
                      
                    }
                  
                  itemsNotFormatted = [];
                  if(all){
                     httpClient
                         .get(self.api, null).then(function(data, response){
                                    if(typeof self.onFormatData() == "function"){
                                        data = self.onFormatData()(data);
                                    }
                                    if(data && data.documents){
                                        var rowsData = data.documents;
                                        var cleanedRows = self.cleanRows(rowsData);
                                        itemsNotFormatted = cleanedRows;
                                        var itemsFormatted = formatCSVData(itemsNotFormatted);
                                        exportData(headers, itemsFormatted, self.exportFileName);
                                    }
                                }, function(err) {
                                    
                                });
                    
                  }else{
                      for(var i = this.startRow; i < this.endRow; i++){
                          itemsNotFormatted.push(this.gridApi.getDisplayedRowAtIndex(i).data);
                       }
                        var itemsFormatted = formatCSVData(itemsNotFormatted);
                        exportData(headers, itemsFormatted, this.exportFileName);
                  }

                  
                      
                }

                function formatCSVData(itemsNotFormatted){
                    var itemsFormatted = [];
                      // format the data
                      itemsNotFormatted.forEach((item) => {
                        if(item){
                          var row = {};
                          // clean and order the obj like headers order
                          for(key in headers){
                            row[key] = item[key] || ""
                          }  

                          // remove comma to prevent errors
                          for(var key in row){
                            if(typeof row[key] == 'string') row[key].replace(/,/g, '');
                          }
                          itemsFormatted.push(row);

                        }
                      });
                      return itemsFormatted;
                }

                function exportData(headers, itemsFormatted, exportFileName){
                  exportCSVFile(headers, itemsFormatted, exportFileName); // call the exportCSVFile() function to process the JSON and trigger the download
                }

            }
        });

angular
    .module('Grid')
    .service("gridService", function(httpClient, wsClient, $q) {

         this.subscribe = function(callback, tag, $scope){
             wsClient.onReady.then(function() {
                 wsClient.subscribe(tag, callback.bind(self), $scope.$id);
             });
         }

        this.gridHelper = function(api, params, transport){
            var d = $q.defer();
             if(transport == "wss"){
                 wsClient
                     .call(api, params, "grid").then(function(data, response){
                     d.resolve(data, response)
                 }, function(err) {
                     d.reject(err)
                 });
                 return d.promise;
             }else{
                httpClient
                    .post(api, params).then(function(data, response){
                    d.resolve(data, response)
                }, function(err) {
                    d.reject(err)
                });
                return d.promise;
            }

        }


        this.getGridData = function(api, params, transport, formatterFnc) {

            var d = $q.defer();
            var self = this;
            if(transport == "https"){
                httpClient
                    .get(api, params).then(function(data, response){
                    if(formatterFnc /**Check if function also*/){
                        data = formatterFnc(data);
                    }
                    if(data && data.documents){
                        var data = {"documents": data.documents, "count": data.count}
                        d.resolve(data, response)
                    }else{
                        d.resolve(null, response)
                    }
                }, function(err) {
                    d.resolve(null);
                    d.reject(err);
                });
                return d.promise;
            }
              else if(transport == "wss"){
                 if(api && typeof api != 'undefined'){
                     wsClient.onReady.then(function() {
                         wsClient
                             .call(api, params, "grid").then(function(data, response) {
                                 if(formatterFnc /**Check if function also*/){
                                     data = formatterFnc(data);
                                 }
                                 if(data && data.documents){
                                     var data = {"documents": data.documents, "count": data.count}
                                     d.resolve(data, response)
                                 }else{
                                     d.resolve(null, response)
                                 }
                             }, function(err) {
                                 d.resolve(null);
                                 d.reject(err);
                             }
                         );
                     });
                     return d.promise;
                 }else{
                     wsClient.onReady.then(function() {
                         wsClient.publish(params, "publish").then(function(data, response) {
                                 if(data && data.documents){
                                     var data = {"documents": data.documents, "count": data.count}
                                     d.resolve(data, response)
                                 }else{
                                     d.resolve(null, response);
                                 }
                             }, function(err) {
                                 d.resolve(null);
                                 d.reject(err);
                             }
                         );
                     });
                     return d.promise;
                 }
            }
        }

    });

angular
    .module('Grid')
    .component('deleteConfirmation',
        {
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            templateUrl:  '/UIComponents/dashboard/frontend/components/grid/popup.html',
            controller: function ($scope) {

                this.onSubmit = function() {
                    this.resolve.grid.onRemoveRow();
                    this.close({$value: true});
                };
                this.onCancel = function () {
                    this.dismiss({$value: false});
                };
            }
        });



