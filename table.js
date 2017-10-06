
if(!Enumerable){
	throw new Error("Enumerable not loaded");
}
let DataGrid = ((() => {
    // Enums
    let DataTypes = {
		'Unknown': "Unknown",
        'Boolean': "Boolean",
        'Numeric': "Numeric",
		'Integer': "Integer",
		'Float': "Float",
        'String': "String",
        'DateTime': "DateTime"
    };
    let SortOrders = {
        Asc: "Asc",
        Desc: "Desc"
    };
    let CellCorrectReasons = {
        MinLength: "MinLength",
        MaxLength: "MaxLength",
        MinValue: "MinValue",
        MaxValue: "MaxValue"
    };
    let QueryFilterTypes = {
		EQUALS: "Equals",
		CONTAINS: "Contains",
		STARTSWITH: "Starts With",
		ENDSWITH: "Ends With",
		NULL: "Null",
		GREATERTHAN: "Greater Than",
		GREATEREQUALTHAN: "Greater Equal Than",
		LESSTHAN: "Lesser Than",
		LESSEQUALTHAN: "Lesser Equal Than",
		IN: "In",
		BETWEEN: "Between"
	};

    let SanitizingDiv = document.createElement("div");

    function EncodeHtml(str){
		SanitizingDiv.innerText = str;
		return SanitizingDiv.innerHTML.split('"').join("&quot;").split("'").join("&#39;");
	}

    // Variables

    let emptyDatasetBase = "<div class='data-grid-table-wrap empty-dataset' data-guid='{0}'>{1}<div style='clear:both;'>No Data</div></div>";
    let tableBase = "<div class='data-grid-table-wrap'>{4}{3}<table class='data-grid' data-guid='{2}'>{0}{1}</table>{3}</div>";
    let headersBase = "<tr class='data-grid-headers'><th class='data-grid-header data-grid-action-header'>Actions</th>{0}</tr>";
    let rowBase = "<tr class='data-grid-row' data-guid='{1}' data-table-guid='{2}'><td class='data-grid-row-actions'>{3}</td>{0}</tr>";
    let cellBase = "<td class='data-grid-cell' data-guid='{1}' data-row-guid='{2}' data-table-guid='{3}'>{0}</td>";
    let headerBase = "<th class='data-grid-header' data-guid='{1}' data-table-guid='{2}'>{0}</th>";
    let checkboxBase = "<input type='checkbox' {0} {1} />";
    let textBase = "<input type='text' value='{0}' {1} />";
    let numberBase = "<input type='number' value='{0}' {1}/>";
    let dateBase = "<input type='date' value='{0}' {1}/>";
    let rowDeleteBase = "<span class='data-grid-rowdelete-btn' data-row-guid='{0}'>Delete</span>";
    let cellMaskBase = "<td class='data-grid-cell-mask' data-guid='{1}' data-row-guid='{2}' data-table-guid='{3}'><div class='data-grid-cell-mask' data-guid='{1}' data-row-guid='{2}' data-table-guid='{3}'>{0}</div></td>";
    let pagerBase = "<div class='pager' data-table-guid='{1}'>{0}</div>";
    let pagerLeftBase = "<div class='pager-left'>{0}{1}</div>";
    let pagerRightBase = "<div class='pager-right'>{0}{1}</div>";
    let pagerFirstBase = '<span class="pager-first pager-control-item" data-pagenumber="0">&lt;&lt;</span>';
    let pagerLastBase =  '<span class="pager-last pager-control-item" data-pagenumber="{0}">&gt;&gt;</span>';
    let pagerPrevBase = '<span class="pager-prev pager-control-item" data-pagenumber="{0}">&lt;</span>';
    let pagerNextBase =  '<span class="pager-next pager-control-item" data-pagenumber="{0}">&gt;</span>';
    let pagerStatsBase = '<span class="pager-stats pager-control-item">Page: {0} of {1} | Showing records {2} - {3} of {4}</span>';
    let filterWidgetBase = '<div class="filter-widget">{0}{1}</div>';
    let columnFilterBase = '<option value="{0}">{0}</option>';

    let filterAddBase = '<div class="filter-widget-add"><div class="form-input"><label class="uniform-label">Column:</label><select class="filter-widget-column-ddl"><option value="">Select Column</option>{0}</select></div><div class="form-input"><label class="uniform-label">Operator:</label><select class="filter-widget-operator-ddl">{{TYPES}}</select></div><div class="form-input"><label class="uniform-label">Query</label><input type="text" class="filter-widget-query-txt"/></div><div class="form-input"><label class="uniform-label">Negated</label><input type="checkbox" class="filter-widget-negated-chk"/></div><div class="form-input"><button class="filter-widget-submit-btn">Add</button><button class="filter-widget-new-complex-btn">New Complex</button></div></div>';
    let filterExistBase = '<div class="filter-widget-show"><table class="filter-widget-show-grid"><tr><th>Actions</th><th>Filters</td></tr>{0}</table></div>';
    let complexFilterExistBase = '<tr class="filter-widget-complex-row" data-guid="{1}"><td><button class="filter-widget-delete-complex-btn">Delete</button></td><td><table class="filter-widget-complex-table"><tr><th>Actions</th><th>Column</th><th>Type</th><th>Query</th><th>Negated</th></tr>{0}</table></td></tr>';
    let simpleFilterExistBase = '<tr data-guid="{4}"><td><button class="filter-widget-delete-simple-btn">Delete</button></td><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>';

    let typeStr = "";
    for(let key in QueryFilterTypes){
		let val = QueryFilterTypes[key];
		typeStr += `<option value='${key}'>${val}</option>`;
	}
    filterAddBase = filterAddBase.replace("{{TYPES}}",typeStr);





    //Classes

    class HtmlDataGrid {
        constructor(dataGrid) {
            let scope = this;
            this.DataGrid = dataGrid;
            this.Html = '';
            this.DomLink = null;
            this.BoundElm = null;	
        }

        SetDataSource(data) {
            this.DataGrid.SetDataSource(data);
            this.ConstructHtml();
        }

        // DOM Value get/set
        GetElmValue(cell) {
            let scope = this;
            let elm = scope.DomQueryForGuid(cell.Guid);
            if (elm == null) {
                return null;
            }
            elm = elm.childNodes[0];

            if (cell.Header.Type == DataTypes.Boolean) {
                return elm.checked;
            } else if (cell.Header.Type == DataTypes.Numeric || cell.Header.Type == DataTypes.Float) {
                return parseFloat(elm.value);
            } else if (cell.Header.Type == DataTypes.Integer) {
                return parseInt(elm.value);
            } 
            else if (cell.Header.Type == DataTypes.DateTime) {
                return new Date(elm.value);
            }
            return elm.value;
        }

        SetElmValue(cell) {
            let scope = this;
            let elm = scope.DomQueryForGuid(cell.Guid);
            if (elm == null) {
                return null;
            }
            elm = elm.childNodes[0];
            if (cell.Header.Type == DataTypes.Boolean) {
                elm.checked = cell.Value;
                elm.textContent = cell.Value;
            } else if (cell.Header.Type == DataTypes.Numeric || cell.Header.Type == DataTypes.Integer || cell.Header.Type == DataTypes.Float) {
                elm.value = cell.Value;
                elm.textContent = cell.Value;
            } else if (cell.Header.Type == DataTypes.DateTime) {
                elm.value = cell.Value.toISOString().split("T")[0]
                elm.textContent = elm.value;
            } else {
                elm.value = cell.Value;
                elm.textContent = cell.Value;
            }
        }

        SyncCellToElm(cell) {
            let scope = this;
            let elm = scope.DomQueryForGuid(cell.Guid);
            if (elm == null) {
                return;
            }
            elm = elm.childNodes[0];
            if (cell.Header.Type == DataTypes.Boolean) {
                elm.checked = cell.Value;
                elm.textContent = cell.Value;
            } else if (cell.Header.Type == DataTypes.Numeric || cell.Header.Type == DataTypes.Integer || cell.Header.Type == DataTypes.Float) {
                elm.value = cell.Value;
                elm.textContent = cell.Value;
            } else if (cell.Header.Type == DataTypes.DateTime) {
                elm.value = cell.Value.toISOString().split("T")[0]
                elm.textContent = elm.value;
            } else {
                elm.value = cell.Value;
                elm.textContent = cell.Value;
            }
        }

        SyncElmToCell(elm) {
            let scope = this;
            let guid = elm.dataset.guid;
            let cell = scope.DataGrid.FindCellByCellGuid(guid);
            if (cell == null) {
                return;
            }
            elm = elm.childNodes[0];

            if (cell.Header.Type == DataTypes.Boolean) {
                cell.Value = elm.checked;
            } else if (cell.Header.Type == DataTypes.Numeric || cell.Header.Type == DataTypes.Float) {
                cell.Value = parseFloat(elm.value);
            } else if (cell.Header.Type == DataTypes.Integer) {
                cell.Value = parseInt(elm.value);
            } else if (cell.Header.Type == DataTypes.DateTime) {
                cell.Value = new Date(elm.value);
            } else {
                cell.Value = elm.value;
            }
        }

        SetCellValue(cell, val) {
            let scope = this;
            cell.Value = val;
            scope.SyncCellToElm(cell);
        }

        // Cell interactivity toggling
        SetCellInteractive(cell) {
            let scope = this;
            let dom = scope.DomQueryForGuid(cell.Guid);
            let interactive = CreateInteractiveCell(cell, cell.Row, cell.Header);

            function onCellBlur(e) {
                if (e.target.parentNode.className.includes("data-grid-cell")) {
                    let cell = scope.DataGrid.FindCellByCellGuid(e.target.parentNode.dataset.guid);
                    scope.SetCellMask(cell);
                }
            }
            let tr = document.createElement("tr");
            tr.innerHTML = interactive;
            let newNode = tr.childNodes[0];
            dom.parentNode.replaceChild(newNode, dom);
            let input = newNode.childNodes[0];
            input.focus();
            input.onblur = onCellBlur;
            try {
                input.selectionStart = input.selectionEnd = input.value.length;
            } catch (e) {

            }
        }

        SetCellMask(cell) {
            let scope = this;
            let dom = scope.DomQueryForGuid(cell.Guid);
            let mask = CreateMaskCellHtml(cell, cell.Row, cell.Header);

            let tr = document.createElement("tr");
            tr.innerHTML = mask;
            let newNode = tr.childNodes[0];
            dom.parentNode.replaceChild(newNode, dom);

        }

        DomQueryForGuid(guid) {
            let scope = this;
            let query = StringFormat("[data-guid='{0}']", [guid]);
            let arr = scope.DomLink.querySelectorAll(query);
            if (arr.length == 0) {
                return null;
            }
            return arr[0];
        }

        DataBind() {
            let scope = this;
            scope.DomBind(scope.BoundElm);
        }

        DomBind(elm) {
            let grid = this;
            this.ConstructHtml();
            grid.BoundElm = elm;
            elm.innerHTML = grid.Html;
            grid.DomLink = elm.childNodes[0];

            function getElmValue(elm, cell) {
                return grid.GetElmValue(cell);
            }

            function setElmValue(elm, cell) {
                return grid.SetElmValue(cell);
            }

            function bindChangeListener(grid) {

                grid.DomLink.addEventListener("change",
                    function onCellChange(e) {
                        
                        if (!e.target.parentNode.className.includes("data-grid-cell")) {
                            return;
                        }
                        let elm = e.target.parentNode;
                        let cell = grid.DataGrid.FindCellByCellGuid(elm.dataset.guid);
                        if (!cell) {
                            return;
                        }
                        let oldVal = cell.Value;
                        let newVal = getElmValue(elm.childNodes[0], cell);
                        cell.Value = newVal;

                        let lengthOk = EnforceLengthsCellValue(cell);
                        let boundOk = FitBoundsCellValue(cell);
                        newVal = cell.Value;
                        if (lengthOk === false || boundOk === false) {
                            setElmValue(elm.childNodes[0], cell);
                        }


                        let rtn = FireEvent(grid.DataGrid.Events.OnCellChanged, [cell, oldVal, newVal, e]);
                        if (IsFireEventResultFalse(rtn)) {
                            cell.Value = oldVal;
                            return false;
                        }

                        //grid.SetCellMask(cell);

                    }
                );
            }

            function bindKeyupListener(grid) {
                grid.DomLink.addEventListener("keyup",
                    function onCellKeyup(e) {
                        if (!e.target.parentNode.className.includes("data-grid-cell")) {
                            return;
                        }
                        let elm = e.target.parentNode;
                        let cell = grid.DataGrid.FindCellByCellGuid(elm.dataset.guid);
                        if (!cell) {
                            return;
                        }
                        let val = getElmValue(elm.childNodes[0], cell);
                        FireEvent(grid.DataGrid.Events.OnCellKeyup, [cell, val, e]);
                    }
                );
            }
            
            function bindDeleteListener(grid) {
                grid.DomLink.addEventListener("click",
                    function deleteRow(e) {
                        if (!e.target.className.includes("data-grid-rowdelete-btn")) {
                            return;
                        }
                        let elm = e.target;
                        let row = grid.DataGrid.FindRowByRowGuid(elm.dataset.rowGuid);
                        if (!row) {
                            return;
                        }
                        grid.DataGrid.DeleteRow(row);
                        grid.DataBind();
                    });
            }

            function bindSortListener(grid) {
                grid.DomLink.addEventListener("click",
                    function onHeaderClick(e) {
                        if (!grid.DataGrid.Sortable) {
                            return;
                        }
                        if (!e.target.className.includes("data-grid-header")) {
                            return;
                        }
                        let elm = e.target;
                        let header = grid.DataGrid.FindHeaderByHeaderGuid(elm.dataset.guid);
                        if (!header) {
                            return;
                        }
                        if(!isShift){
                            grid.DataGrid.SortDetails = new SortCollection();
                        }
                        if (header.SortDir == undefined) {
                            header.SortDir = SortOrders.Asc;
                        }
                        let sortDir = header.SortDir;
                        let sortDetail = _.From(grid.DataGrid.SortDetails).First(x=>x.Name == header.Name);
                        if(sortDetail == null){
                            sortDetail = new SortDetail(header.Name,sortDir);
                            grid.DataGrid.SortDetails.push(sortDetail);
                        }
                        sortDetail.Direction = sortDir;
                        if(grid.DataGrid instanceof AjaxGrid){
                            grid.DataGrid.PageNumber = 0;
                            grid.DataGrid._getPage(()=>{
                                for(let h of grid.DataGrid.Table.Headers){
                                    if(h.Name == header.Name){
                                        if (sortDir == SortOrders.Asc) {
                                            h.SortDir = SortOrders.Desc;
                                        } else {
                                            h.SortDir = SortOrders.Asc;
                                        }								h
                                    }
                                }
                            });
                        }
                        else if(grid.DataGrid instanceof DataGrid){
                            grid.DataGrid.ApplySort();
                            grid.DataGrid.PageNumber = 0;
                            grid.DataBind();
                            if (sortDir == SortOrders.Asc) {
                                header.SortDir = SortOrders.Desc;
                            } else {
                                header.SortDir = SortOrders.Asc;
                            }
                        }				
                    });
            }

            function bindClickListener(grid) {
                grid.DomLink.addEventListener("click",
                    function onCellClick(e) {
                        if (e.target.className.includes("data-grid-cell-mask")) {
                            if(grid.DataGrid.ReadOnly){
                                return false;
                            }
                            let cell = grid.DataGrid.FindCellByCellGuid(e.target.dataset.guid);
                            if (cell.ReadOnly || cell.Row.ReadOnly || cell.Header.ReadOnly) {
                                return;
                            }
                            grid.SetCellInteractive(cell);
                        }
                    }
                );
            }
            
            function bindPagerListener(grid) {
                grid.DomLink.addEventListener("click",
                function onPagerClick(e){
                        if(e.target.className.includes("pager-control-item")){
                            const pagenumber = e.target.dataset.pagenumber;
                            if(e.target.className.includes("pager-first")){
                                grid.GoToPage(0);
                                return;
                            }
                            if(e.target.className.includes("pager-last")){
                                grid.GoToPage(pagenumber);
                                return;
                            }
                            if(e.target.className.includes("pager-prev")){
                                grid.PrevPage();
                                return;
                            }
                            if(e.target.className.includes("pager-next")){
                                grid.NextPage();
                                return;
                            }
                        }
                });
            }
            
            let complexFilterOverride = null;
            function bindFilterListener(grid) {
                grid.DomLink.addEventListener("click",
                function onFilterClick(e){
                        if(e.target.className.includes("filter-widget-new-complex-btn")){
                            grid.DataGrid.FilterDetails.AddComplexFilter();
                            grid.DataBind();
                        }
                        if(e.target.parentNode && e.target.parentNode.className.includes("filter-widget-complex-row")){
                            let guid = e.target.parentNode.dataset.guid;
                            let cf = grid.DataGrid.FilterDetails.FindAnyFilterByGuid(guid);
                            complexFilterOverride = cf;
                            let matches = grid.DomLink.querySelectorAll(".selected-complex-filter");
                            for(let match of matches){
                                match.className = match.className.replace("selected-complex-filter","");
                            }
                            e.target.parentNode.className += " selected-complex-filter";
                        }
                        if(e.target.className.includes("filter-widget-submit-btn")){
                            let complexFilter = complexFilterOverride || _.From(grid.DataGrid.FilterDetails.ComplexFilters).Last();
                            if(complexFilter == null){
                                complexFilter = grid.DataGrid.FilterDetails.AddComplexFilter();						
                            }
                            let colName = grid.DomLink.querySelectorAll(".filter-widget-column-ddl")[0].value;
                            if(colName === ""){
                                return false;
                            }
                            let operator = grid.DomLink.querySelectorAll(".filter-widget-operator-ddl")[0].value;
                            let query = grid.DomLink.querySelectorAll(".filter-widget-query-txt")[0].value;
                            let negated = grid.DomLink.querySelectorAll(".filter-widget-negated-chk")[0].checked;
                            
                            grid.DataGrid.AddSimpleFilter(colName,operator,query,negated,complexFilter);
                            if(grid.DataGrid instanceof AjaxGrid){
                                grid.DataGrid.RefreshToFirstPage();
                            } else {
                                grid.DataGrid.ApplyFilter();
                                grid.DataGrid.PageNumber = 0;
                                grid.DataBind();
                            }
                            
                        }
                        else if(e.target.className.includes("filter-widget-delete")){
                            let guid = e.target.parentNode.parentNode.dataset.guid;
                            grid.DataGrid.RemoveFilterByGuid(guid);
                            if(grid.DataGrid instanceof AjaxGrid){
                                grid.DataGrid.RefreshToFirstPage();
                            } else {
                                grid.DataGrid.ApplyFilter();
                                grid.DataGrid.PageNumber = 0;
                                grid.DataBind();
                            }
                        }
                });
            }


            // Bind Cell Change events
            bindChangeListener(grid);
            bindKeyupListener(grid);
            bindDeleteListener(grid);
            bindSortListener(grid);
            bindClickListener(grid);
            bindPagerListener(grid);
            bindKeydownListener();
            bindFilterListener(grid);


        }

        ConstructHtml() {
            let grid = this;
            grid.Html = CreateTableHtml(grid.DataGrid.Table);
        }

        // Paging
        NextPage() {
            let scope = this;
            scope.DataGrid.NextPage();
            scope.DataBind();
        }

        PrevPage() {
            let scope = this;
            scope.DataGrid.PrevPage();
            scope.DataBind();
        }

        GoToPage(i) {
            let scope = this;
            scope.DataGrid.GoToPage(i);
            scope.DataBind();
        }
    }

    let isShift = false;
    let boundShiftListener = false;
    function checkIfShift(e){
		let code = e.keyCode || e.which;
		isShift = code === 16;
	}
    function bindKeydownListener() {
		if(!boundShiftListener){
			document.body.addEventListener("keydown",checkIfShift,false);
			boundShiftListener = true;
		}
	}
    class SortDetail{
		constructor(name,dir){
			this.Name = name;
			this.Direction = dir;
		}
		GetHeaderByName(headers){
			let name = this.Name;
			return _.From(headers).First(x=>x.Name == name);
		}
	}

    class DataGrid {
        constructor(data) {
            let grid = this;
            grid.Guid = CreateGuid();
            grid.Data = data;
            grid.Sortable = true;
            grid.ReadOnly = false;
            grid.Filterable = true;
            grid.Deletable = true;
            grid.Addable = true;
            grid.Pageable = true;
            grid.HtmlGrids = [];
            grid.Events = {};
            grid.Events.OnRowAdded = [];
            grid.Events.OnColumnAdded = [];
            grid.Events.OnRowDeleted = [];
            grid.Events.OnColumnDeleted = [];
            grid.Events.OnCellFormatting = [];
            grid.Events.OnDataBind = [];
            grid.Events.OnRowDataBind = [];
            grid.Events.OnCellDataBind = [];
            grid.Events.OnCellChanged = [];
            grid.Events.OnCellKeyup = [];
            grid.Events.OnCellValueCorrected = [];
            grid.Events.OnNextPage = [];
            grid.Events.OnPrevPage = [];
            grid.Events.OnGoToPage = [];
            grid.Events.OnEmptyDataBind = [];
            grid.PageNumber = 0;
            grid.SortDetails = new SortCollection();
            grid.FilterDetails = new FilterCollection();
            grid._itemsPerPage = 999999999;
        }
		get ItemsPerPage(){
			return this._itemsPerPage;
		}
		set ItemsPerPage(val){
			this._itemsPerPage = val;
			this.PageNumber = 0;
		}
		get TotalPages(){
			return Math.ceil(this.TotalItems / this.ItemsPerPage);
		}

        CreateHtmlGrid() {
            let scope = this;
            let rtn = new HtmlDataGrid(scope);
            this.HtmlGrids.push(rtn);
            return rtn;
        }

        //Filtering
        AddSimpleFilter(name, type, query, negated, complexFilter) {
            let simpleFilter = complexFilter.Add(name,type,query,negated);
            return simpleFilter;
        }

        RemoveFilter(opt) {
            opt.Detach();	
        }

        RemoveFilterByGuid(guid) {
            let scope = this;
            let match = this.FilterDetails.FindAnyFilterByGuid(guid);
            if(match !== null){
                match.Detach();
            }		
        }

        // Querying
        FindRowByRowGuid(guid) {
            let scope = this;
            return scope.Table.RowHash.get(guid);
        }

        FindCellByCellGuid(guid) {
            let scope = this;
            return scope.Table.CellHash.get(guid);
        }

        FindHeaderByHeaderGuid(guid) {
            let scope = this;

            for (let header of scope.Table.Headers) {
                if (header.Guid == guid) {
                    return header;
                }
            }
        }

        FindColumnByColumnGuid(guid) {
            let scope = this;
            let header = scope.FindHeaderByHeaderGuid(guid);
            if (!header) {
                return null;
            }
            return header.Column;
        }

        // Sorting
        ApplySort() {
            let scope = this;
            if (!scope.Sortable) {
                return;
            }
            let actOnFilter = scope.Table.FilteredRows !== null;
            let query = _.From(scope.Table.FilteredRows || scope.Table.Rows);
            let thenBy = false;
            for(let sort of scope.SortDetails){
                let header = sort.GetHeaderByName(scope.Table.Headers);
                let idx = -1;
                for(let hdr of scope.Table.Headers){
                    idx++;
                    if(header.Name == hdr.Name){
                        break;
                    }
                }
                if(thenBy){
                    if(sort.Direction == SortOrders.Asc){
                        query = query.ThenBy(x=>x.Cells[idx].Value);
                    } else {
                        query = query.ThenByDescending(x=>x.Cells[idx].Value);				
                    }
                } else {
                    if(sort.Direction == SortOrders.Asc){
                        query = query.OrderBy(x=>x.Cells[idx].Value);
                    } else {
                        query = query.OrderByDescending(x=>x.Cells[idx].Value);				
                    }	
                    thenBy = true;
                }
            }
            let rows = query.ToArray();
            if(actOnFilter){
                scope.Table.FilteredRows = rows;
            } else {
                scope.Table.Rows = rows;	
            }
            
        }
        // Filtering
        ApplyFilter() {
            let scope = this;
            if (!scope.Filterable) {
                return;
            }
            let finalQuery = _.From([]);
            
            for(let cf of scope.FilterDetails.ComplexFilters){
                if(cf.SimpleFilters.length === 0){
                    continue;
                }
                let query = _.From(scope.Table.Rows);
                
                for(let sf of cf.SimpleFilters){
                    let filter = sf;
                    let idx = -1;
                    for(let hdr of scope.Table.Headers){
                        idx++;
                        if(filter.Name == hdr.Name){
                            break;
                        }
                    }
                    let method = query.Where;
                    if(filter.Negated){
                        method = pred => query.Where(x=>!pred(x))
                    }
                    let queryData = filter.Query;
                    let header = scope.Table.Headers[idx];
                    queryData = ParseData(queryData , header.Type);

                    if(filter.Type == "EQUALS"){
                        query = method.apply(query,[x=>x.Cells[idx].Value == queryData]);
                    }
                    else if(filter.Type == "CONTAINS"){
                        query = method.apply(query,[x=>x.Cells[idx].Value.includes(queryData)]);
                    }
                    else if(filter.Type == "STARTSWITH"){
                        query = method.apply(query,[x=>x.Cells[idx].Value.indexOf(queryData) === 0]);
                    }
                    else if(filter.Type == "ENDSWITH"){
                        query = method.apply(query,[x=> x.Cells[idx].Value.lastIndexOf(queryData) === x.Cells[idx].Value.length - queryData.length]);
                    }
                    else if(filter.Type == "GREATERTHAN"){
                        query = method.apply(query,[x=>x.Cells[idx].Value > queryData]);
                    }
                    else if(filter.Type == "GREATEREQUALTHAN"){
                        query = method.apply(query,[x=>x.Cells[idx].Value >= queryData]);
                    }
                    else if(filter.Type == "LESSTHAN"){
                        query = method.apply(query,[x=>x.Cells[idx].Value < queryData]);
                    }
                    else if(filter.Type == "LESSEQUALTHAN"){
                        query = method.apply(query,[x=>x.Cells[idx].Value <= queryData]);
                    }
                    else if(filter.Type == "NULL"){
                        query = method.apply(query,[x=>x.Cells[idx].Value  == null]);
                    }
                    else if(filter.Type == "IN"){
                        let ds = filter.Query.split(",");
                        for(let i = 0; i < ds.length; i++){
                            ds[i] = ParseData(ds[i],header.Type);
                        }
                        query = method.apply(query,[x=>ds.includes(x.Cells[idx].Value)]);				
                    }
                    else if(filter.Type == "BETWEEN"){
                        let ds = filter.Query.split(",");
                        for(let i = 0; i < ds.length; i++){
                            ds[i] = ParseData(ds[i],header.Type);
                        }
                        query = method.apply(query,[x=>x.Cells[idx].Value >= ds[0] && x.Cells[idx].Value <= ds[1]]);				
                    }
                }
                finalQuery = finalQuery.Union(query);
            }
            let rows = finalQuery.ToArray();
            scope.Table.FilteredRows = rows;		
        }

        // Extending
        AddRow() {
            let scope = this;
            if (!scope.Addable) {
                return false;
            }
            let row = new Row({Cells: []}, scope.Table);

            for (let header of scope.Table.Headers) {
                let val = GetDefaultData(header.Type);
                let cell = new Cell({Value: val}, row, header);
                row.Cells.push(cell);
            }

            let rtn = FireEvent(scope.Events.OnRowAdded, [row]);
            if (IsFireEventResultFalse(rtn)) {
                return false;
            }
            scope.Table.Rows.push(row);
        }

        DeleteRow(row) {
            let scope = this;
            if (!scope.Deletable) {
                return false;
            }
            if (row.Deletable === false || row.ReadOnly) {
                return false;
            }

            let rtns = FireEvent(scope.Events.OnRowDeleted, [row]);
            if (IsFireEventResultFalse(rtns)) {
                return false;
            }
            let idx = scope.Table.Rows.indexOf(row);
            scope.Table.Rows.splice(idx, 1);

        }

        AddColumn(hdr) {
            let scope = this;
            if (!scope.Addable) {
                return false;
            }

            let header = new Header(hdr, scope.Table.Headers.length, scope.Table);
            let column = new Column(header);

            let rtn = FireEvent(scope.Events.OnColumnAdded, [column]);
            if (IsFireEventResultFalse(rtn)) {
                return false;
            }

            scope.Table.Columns.push(column);
            scope.Table.Headers.push(header);

            for (let row of scope.Table.Rows) {
                let val = GetDefaultData(header.Type);
                let cell = new Cell({Value: val},row,header);
                row.Cells[column.Index] = cell;
                column.Cells.push(cell);
            }
        }

        DeleteColumn(column) {
            let scope = this;
            if (!scope.Deletable) {
                return false;
            }
            if (column.Header.Deletable == false || column.Header.ReadOnly) {
                return false;
            }
            let rtns = FireEvent(scope.Events.OnColumnDeleted, [column]);
            if (IsFireEventResultFalse(rtns)) {
                return false;
            }
            let idx = scope.Table.Columns.indexOf(column);
            scope.Table.Headers.splice(idx, 1);

            for (let row of scope.Table.Rows) {
                row.Cells.splice(idx, 1);
            }
        }

        // Paging
        NextPage() {
            let scope = this;
            if(scope.Pageable === false){
                return false;
            }
            let total = scope.TotalPages;
            scope.PageNumber = Math.min(total, scope.PageNumber + 1);
            if(scope instanceof AjaxGrid){
                scope._getPage();
            }
            FireEvent(scope.Events.OnNextPage, [scope.PageNumber]);
        }

        PrevPage() {
            let scope = this;
            if(scope.Pageable === false){
                return false;
            }
            scope.PageNumber = Math.max(0, scope.PageNumber - 1);
            if(scope instanceof AjaxGrid){
                scope._getPage();
            }		
            FireEvent(scope.Events.OnPrevPage, [scope.PageNumber]);
        }

        GoToPage(i) {
            let scope = this;
            if(scope.Pageable === false){
                return false;
            }
            let total = scope.TotalPages;
            scope.PageNumber = Math.min(total, i);
            scope.PageNumber = Math.max(scope.PageNumber, 0);
            if(scope instanceof AjaxGrid){
                scope._getPage();
            }
            FireEvent(scope.Events.OnGoToPage, [scope.PageNumber]);
        }

        // JSON Utilities
        GetHeaderJSON() {
            let scope = this;
            let json = [];

            for (let header of scope.Table.Headers) {
                let jsonHeader = HeaderToJSON(header);
                json.push(jsonHeader);
            }

            return json;
        }

        GetRowsJSON() {
            let scope = this;
            let rows = [];

            for (let row of scope.Table.Rows) {
                let jsonRow = RowToJSON(row);
                rows.push(jsonRow);
            }

            return rows;
        }

        ToJSON() {
            let scope = this;
            let data = {};
            data.Headers = scope.GetHeaderJSON();
            data.Rows = scope.GetRowsJSON();
            return data;
        }

        ToJSONString() {
            let scope = this;
            let json = scope.ToJSON();
            return JSON.stringify(json);
        }

        // Data Filtering/Querying
        FilterRows(query) {
            let scope = this;
            let g = new DataGrid();
            let headers = scope.GetHeaderJSON();
            let rows = [];

            for (let r of scope.Table.Rows) {
                let result = query(r);
                if (result) {
                    let row = RowToJSON(r);
                    rows.push(row);
                }
            }

            let data = {};
            data.Headers = headers;
            data.Rows = rows;
            g.SetDataSource(data);
            return g;
        }

        FilterColumn(column, query) {
            let scope = this;
            let g = new DataGrid();
            let headers = scope.GetHeaderJSON();
            let rows = [];

            for (let cell of column.Cells) {
                let result = query(cell);
                if (result) {
                    let row = RowToJSON(cell.Row);
                    rows.push(row);
                }
            }

            let data = {};
            data.Headers = headers;
            data.Rows = rows;
            g.SetDataSource(data);
            return g;
        }

        // TODO-Rename to ChooseColumns
        FilterColumns(query) {
            let scope = this;
            let g = new DataGrid();
            let headers = [];
            let rows = [];
            let indexes = [];

            for (let header of scope.Table.Headers) {
                if (query(header)) {
                    headers.push(HeaderToJSON(header));
                    indexes.push(header.Index);
                }
            }

            for (let row of scope.Table.Rows) {
                let newRow = RowToJSON(row);
                let cells = [];

                for (let idx of indexes) {
                    cells.push(newRow.Cells[idx]);
                }

                newRow.Cells = cells;
                rows.push(newRow);
            }

            let data = {};
            data.Headers = headers;
            data.Rows = rows;
            g.SetDataSource(data);
            return g;
        }

        // Data Binding
        SetDataSource(data) {
            let scope = this;
            FireEvent(scope.Events.OnDataBind, [data]);
            scope.Table = new Table(data, scope);
        }

        DataBind() {
            let scope = this;
            scope.PageNumber = 0;
            scope.SetDataSource(scope.Table);
            //DataGrid.prototype.DomBind(DataGrid.prototype.BoundElm);

        }

        RemoveSortDetails() {
            let scope = this;
            scope.SortDetails = new SortCollection();
        }

        RemoveFilterDetails() {
            let scope = this;
            scope.FilterDetails = new FilterCollection();
        }

        ToCSV(delimiter = ",") {
            let headerCsv = `${_.From(this.Table.Headers).Select(y=>y.Name).Write(delimiter)}\n`;
            let rowCsv = _.From(this.Table.Rows).Select(x=>_.From(x.Cells).Select(y=>y.Value).Write(delimiter)).Write("\n");
            return headerCsv + rowCsv;
        }

        get TotalItems() {
			if(this.Table.FilteredRows){
				return this.Table.FilteredRows.length;
			}
			return this.Table.Rows.length;
		}

        static LoadFromJSONArray(rows, headers) {
            let data = JsonArrayToValidInput(rows,headers);
            let scope =  new DataGrid();
            scope.SetDataSource(data);
            return scope;
        }
    }

    DataGrid.prototype.BindEvent = BindEvent;
    DataGrid.prototype.UnBindEvent = UnBindEvent;
    DataGrid.prototype.FireEvent = FireEvent;
    DataGrid.prototype.SortOrders = SortOrders;
    DataGrid.prototype.DataTypes = DataTypes;
    DataGrid.prototype.CellCorrectReasons = CellCorrectReasons;

    class Table{
		constructor(data, grid){
			let scope = this;
			scope.DataGrid = grid;
			grid.Table = scope;

			scope.Headers = scope._ExtractHeaders(data.Headers);
			scope.Columns = scope._ExtractColumns(scope.Headers);
			scope.Rows = scope._ExtractRows(data.Rows);
		}
		_ExtractHeaders(headers){
			let rtn = [];
			for(let i = 0; i < headers.length; i++){
			   let header = headers[i];
			   rtn.push( new Header(header, i , this) );
			}
			return rtn;
		}
		_ExtractColumns(headers){
			let rtn = [];

			for (let header of headers) {
				rtn.push( new Column(header) );
			}

			return rtn;
		}
		_ExtractRows(rows){
			let rtn = [];

			for (let rowProto of rows) {
				let row = new Row(rowProto,this);
				if(row === null){
					continue;
				}
				rtn.push( row );
			}

			return rtn;
		}
	}
    class Header{
		constructor(header, index, table){
			let scope = this;
			scope.Guid = CreateGuid();
			scope.Table = table;
			scope.Type = header.Type;
			scope.ReadOnly = header.ReadOnly;
			scope.Name = header.Name;
			scope.Deletable = header.Deletable;
			scope.MinLength = header.MinLength;
			scope.MaxLength = header.MaxLength;
			scope.MinValue = header.MinValue;
			scope.MaxValue = header.MaxValue;
			scope.Data = header.Data;
			scope.TableGuid = table.Guid;
			scope.Index = index;
		}
	}
    class Column{
		constructor(header){
			this.Header = header;
			this.Index = header.Index;
			this.Guid = header.Guid;
			this.Cells = [];
			header.Column = this;
		}
    }
    class Row{
		constructor(row, table){
			let scope = this;
			scope.Data = row.Data;
			scope.ReadOnly = row.ReadOnly;
			scope.Deletable = row.Deletable;
			let headers = table.Headers;
			let cells = row.Cells;

			scope.Table = table;
			scope.Headers = table.Headers;

			scope.Cells = [];
				
			let i = 0;
			for (let cellProto of cells) {
				let header = scope.Headers[i];
				let cell = new Cell(cellProto,scope,header);
				scope.Cells.push(cell);
				i++;
			}

			let rtns = FireEvent(scope.Table.DataGrid.Events.OnRowDataBind, [scope]);
			if (IsFireEventResultFalse(rtns)) {
				return null;
			}
		}
    }
    class Cell{
		constructor(cell,row,header){
			let scope = this;
			scope.Data = cell.Data;
			scope.ReadOnly = cell.ReadOnly;
			scope.Value = ParseData(cell.Value, header.Type);
			scope.Row = row;
			scope.Table = row.Table;
			scope.Header = header;
			scope.Column = header.Column;
			scope.Table.Columns[header.Index].Cells.push(scope);
			FitBoundsCellValue(scope);
			EnforceLengthsCellValue(scope);
			FireEvent(scope.Table.DataGrid.Events.OnCellDataBind, [scope]);	
		}
	}

    class Pager {
        constructor(totalItems, pageNumber, itemsPerPage) {
            this.TotalItems = totalItems;
            this.PageNumber = pageNumber;
            this.ItemsPerPage = itemsPerPage;
        }

        get TotalPages() {
			 return Math.ceil(this.TotalItems / this.ItemsPerPage);
		}

        get PageNumberOneBased() {
			 return this.PageNumber + 1;
		}

        get LastPageOneBased() {
			 return this.LastPage + 1;
		}

        get PreviousPage() {
                if (this.HasPreviousPage === false)
                {
                    return null;
                }
                return this.PageNumber - 1;
		}

        get NextPage() {
			if (this.HasNextPage == false)
			{
				return null;
			}
			return this.PageNumber + 1;
		}

        get LastPage() {
			return this.TotalPages - 1;
		}

        get HasNextPage() {
			return this.TotalPages > 0 && this.PageNumber < this.LastPage; 
		}

        get HasPreviousPage() {
			return this.TotalPages > 0 && this.PageNumber > 0; 
		}

        get IsPageNumberValid() {
			return this.PageNumber >= 0 && this.PageNumber < this.TotalPages;
		}

        get StartingItemIndex() {
                if (this.TotalItems == 0 || this.IsPageNumberValid == false)
                {
                    return null;
                }
                return (this.PageNumber*this.ItemsPerPage) + 1;
		}

        get EndingItemIndex() {
           if (this.TotalItems == 0 || this.IsPageNumberValid == false){
                    return null;
            }
                const idx = (this.PageNumber * this.ItemsPerPage) + this.ItemsPerPage;
                return Math.min(this.TotalItems, idx);
		}
    }

    // Events
    function BindEvent(eventProp, action) {
        eventProp.push(action);
    }
    function UnBindEvent(eventProp, action) {
        let idx = eventProp.indexOf(action);
        if (idx > -1) {
            eventProp.splice(idx, 1);
        }
    }
    function FireEvent(eventProp, args) {
        if(eventProp.length === 0){
			return [];
		}
        let rtns = [];

        for (let action of eventProp) {
            let rtn = action.apply(this, args);
            rtns.push(rtn);
        }

        return rtns;
    }
    function IsFireEventResultFalse(rtn) {
        for (let i = 0; i < rtn.length; i++) {
            if (rtn[i] == false) {
                return true;
            }
        }
    }

    // Parsing
    function ParseData(value, dataType) {
            if(value == null){
				return GetDefaultData(dataType);
			}
			if (dataType == DataTypes.String) {
				return value;
			}
			if (dataType == DataTypes.Numeric || dataType == DataTypes.Float) {
				return parseFloat(value);
			}
			if(dataType == DataTypes.Integer){
				return parseInt(value);
			}
			if (dataType == DataTypes.DateTime) {
				return new Date(value);
			}
			if (dataType == DataTypes.Boolean) {
				return !!value;
			}
			return value;
		}
    function GetDefaultData(dataType) {
        if (dataType == DataTypes["String"]) {
            return "";
        }
        if (dataType == DataTypes.Numeric || dataType == DataTypes.Float || dataType == DataTypes.Integer) {
            return 0;
        }
        if (dataType == DataTypes.Boolean) {
            return false;
        }
        if (dataType == DataTypes.DateTime) {
            return new Date(0);
        }
        return null;
    }

    // Utilities
    function StringFormat(str, objects) {
        let rtn = str;
        for (let i = 0; i < objects.length; i++) {
            let find = `{${i}}`;
            rtn = rtn.split(find).join(objects[i]);
        }
        return rtn;
    }
    function CreateGuid() {
		return Math.random() + "";
    }

    // JSON Utilities
    function HeaderToJSON(header) {
        let jsonHeader = {};
        jsonHeader.Name = header.Name;
        jsonHeader.ReadOnly = header.ReadOnly;
        jsonHeader.Deletable = header.Deletable;
        jsonHeader.Type = header.Type;
        jsonHeader.MinLength = header.MinLength;
        jsonHeader.MaxLength = header.MaxLength;
        jsonHeader.MinValue = header.MinValue;
        jsonHeader.MaxValue = header.MaxValue;
		jsonHeader.Data = header.Data;
        return jsonHeader;
    }
    function RowToJSON(row) {
        let jsonRow = {};
        jsonRow.ReadOnly = row.ReadOnly;
        jsonRow.Deletable = row.Deletable;
        jsonRow.Data = row.Data;
        jsonRow.Cells = [];

        for (let cell of row.Cells) {
            let newCell = CellToJSON(cell);
            jsonRow.Cells.push(newCell);
        }

        return jsonRow;
    }
    function CellToJSON(cell) {
        let jsonCell = {};
        jsonCell.ReadOnly = cell.ReadOnly;
        jsonCell.Value = cell.Value;
		jsonCell.Data = cell.Data;
        return jsonCell;
    }

    // Table Creation

    function CreateTableHtml(data) {

		data.Guid = CreateGuid();
		data.RowHash = new Map();
		data.CellHash = new Map();
		
		let filterHtml = CreateFilterHtml(data.DataGrid.Table);
		
		if(data.Rows.length === 0){
			return StringFormat(emptyDatasetBase, [data.Guid,filterHtml]);
		}
	
		let pagerHtml = CreatePagerHtml(data);

        let headers = CreateHeadersHtml(data);
        let rows = CreateRowsHtml(data);

        let table = StringFormat(tableBase, [headers, rows, data.Guid,pagerHtml,filterHtml]);

        return table;
    }

    function CreateFilterHtml(data){
		let scope = data.DataGrid;
		if(scope.Filterable === false){
			return "";
		}
		let headers = data.Headers;
		let opts = "";
		for(let hdr of headers){
			opts += StringFormat(columnFilterBase, [hdr.Name]);
		}
		let filterAdd = StringFormat(filterAddBase, [opts]);
		
		let cfHtml = "";
		for(let cf of scope.FilterDetails.ComplexFilters){
			let sfHtml = "";
			for(let sf of cf.SimpleFilters){
				sfHtml += StringFormat(simpleFilterExistBase, [sf.Name,sf.Type,sf.Query,sf.Negated,sf.Guid]);
			}
			cfHtml += StringFormat(complexFilterExistBase,[sfHtml,cf.Guid]);
		}
		
		let filterExist = StringFormat(filterExistBase, [cfHtml]);
		
		let filterHtml = StringFormat(filterWidgetBase, [filterAdd,filterExist]);
		return filterHtml;
		
	}

    function CreatePagerHtml(data){
		if(!data.DataGrid.Pageable){
			return "";
		}

		let pager = new Pager(data.DataGrid.TotalItems, data.DataGrid.PageNumber, data.DataGrid.ItemsPerPage);
		let innerHtml = "";
		if (pager.HasPreviousPage)
		{
			let first = pagerFirstBase;
			let prev = StringFormat(pagerPrevBase,[pager.PreviousPage]);
			innerHtml += StringFormat(pagerLeftBase, [first,prev]);
		} else {
			innerHtml += StringFormat(pagerLeftBase,["",""]);
		}
		if (pager.HasNextPage)
		{
			let next = StringFormat(pagerNextBase,[pager.NextPage]);
			let last = StringFormat(pagerLastBase,[pager.LastPage]);
			innerHtml += StringFormat(pagerRightBase, [next,last]);
		} else {
			innerHtml += StringFormat(pagerRightBase,["",""]);			
		}
    
		if (pager.TotalItems > 0)
		{
			innerHtml += StringFormat(pagerStatsBase,[pager.PageNumberOneBased,pager.LastPageOneBased,pager.StartingItemIndex,pager.EndingItemIndex,pager.TotalItems]);
		}
		
		let pagerHtml = StringFormat(pagerBase, [innerHtml, data.Guid]);
		return pagerHtml;
	}
    function CreateColumns(data) {
        data.Columns = [];

        for (let header of data.Headers) {
            let column = new Column(header);
            data.Columns.push(column);
        }
    }

    function CreateHeadersHtml(data) {
        let headers = data.Headers;
        let headerCells = "";

        for (let header of headers) {
            let headerCell = StringFormat(headerBase, [header.Name, header.Guid, data.Guid]);
            headerCells += headerCell;
        }

        let base = headersBase;
        let headerRow = StringFormat(base, [headerCells]);

        return headerRow;
    }

    // Row Creation Helpers
    function CreateRowsHtml(data) {

        let rows = data.FilteredRows || data.Rows;
        let rowsHtml = "";
        let startRow = (data.DataGrid.PageNumber * data.DataGrid.ItemsPerPage);
        let endRow = Math.min(data.DataGrid.TotalItems, (data.DataGrid.PageNumber + 1) * data.DataGrid.ItemsPerPage);
	    let diff = endRow - startRow;
		if(startRow >= rows.length){
			let diff = endRow - startRow;
			startRow = 0;
			endRow = Math.min(diff,rows.length);
		}
		if(endRow >= rows.length){
		   endRow = Math.min(rows.length,startRow + diff);
		}
        for (let i = startRow; i < endRow; i++) {
            let row = rows[i];
            let rowHtml = CreateRowHtml(row, data);
            rowsHtml += rowHtml;
        }

        return rowsHtml;
    }

    function CreateRowHtml(row, data) {
        row.Guid = CreateGuid();
        row.TableGuid = row.Table.Guid;
        row.Table.RowHash.set(row.Guid, row);

        let headers = data.Headers;
        let cells = row.Cells;
        let rowCells = "";

		let i = 0;
        for (let cell of cells) {
            let header = headers[i];
            let rowCell = CreateCellHtml(cell, row, header);
            rowCells += rowCell;
			i++;
        }

        let base = rowBase;
        let actions = "";
        if ((data.DataGrid.Deletable || row.Deletable) && !row.ReadOnly) {
            actions += StringFormat(rowDeleteBase, [row.Guid]);
        }
        let rowHtml = StringFormat(base, [rowCells, row.Guid, row.TableGuid, actions]);
        return rowHtml;
    }

    // Cell Creation Helpers
    function CreateCellHtml(cell, row, header) {
        cell.Guid = CreateGuid();
        cell.RowGuid = row.Guid;
        cell.TableGuid = row.TableGuid;
        cell.Table.CellHash.set(cell.Guid,cell);
        return CreateMaskCellHtml(cell, row, header);
    }

    function CreateInteractiveCell(cell, row, header) {
        if (header.Type == DataTypes.Boolean) {
            return CreateBooleanCellHtml(cell, row, header);
        } else if (header.Type == DataTypes.Numeric || header.Type == DataTypes.Float || header.Type == DataTypes.Integer) {
            return CreateNumericCellHtml(cell, row, header);
        } else if (header.Type == DataTypes.DateTime) {
            return CreateDatetimeCellHtml(cell, row, header);
        } else {
            return CreateTextCellHtml(cell, row, header);
        }
    }

    function CreateMaskCellHtml(cell, row, header) {
        FireEvent(cell.Table.DataGrid.Events.OnCellFormatting, [cell]);
        let display = cell.Mask != undefined ? cell.Mask : cell.Value;
		if(header.Type == DataTypes.String){
			display = EncodeHtml(display);
		}
        return StringFormat(cellMaskBase, [display, cell.Guid, cell.RowGuid, cell.TableGuid]);
    }

    function CreateBooleanCellHtml(cell, row, header) {
        let checked = cell.Value ? "checked" : "";
        let readOnly = header.ReadOnly || cell.ReadOnly || row.ReadOnly ? "disabled" : "";
        let rowCell = StringFormat(cellBase, [StringFormat(checkboxBase, [checked, readOnly]), cell.Guid, cell.RowGuid, cell.TableGuid]);
        return rowCell;
    }

    function CreateNumericCellHtml(cell, row, header) {
        let readOnly = header.ReadOnly || cell.ReadOnly || row.ReadOnly ? "readonly" : "";
        let rowCell = StringFormat(cellBase, [StringFormat(numberBase, [cell.Value, readOnly]), cell.Guid, cell.RowGuid, cell.TableGuid]);
        return rowCell;
    }

    function CreateDatetimeCellHtml(cell, row, header) {
        let readOnly = header.ReadOnly || cell.ReadOnly || row.ReadOnly ? "readonly" : "";
        let rowCell = StringFormat(cellBase, [StringFormat(dateBase, [cell.Value.toISOString().split('T')[0], readOnly]), cell.Guid, cell.RowGuid, cell.TableGuid]);
        return rowCell;
    }

    function CreateTextCellHtml(cell, row, header) {
        let readOnly = header.ReadOnly || cell.ReadOnly || row.ReadOnly ? "readonly" : "";
		let val = EncodeHtml(cell.Value);
        let rowCell = StringFormat(cellBase, [StringFormat(textBase, [val, readOnly]), cell.Guid, cell.RowGuid, cell.TableGuid]);
        return rowCell;
    }

    function FitBoundsCellValue(cell) {
        if (cell.ReadOnly || cell.Row.ReadOnly || cell.Header.ReadOnly) {
            return true;
        }
        let hadToBound = false;
        let header = cell.Header;

        if (header.MinValue != undefined) {
            let min = ParseData(header.MinValue, cell.Header.Type);
            if (cell.Value < min) {
                let oldVal = cell.Value;
                let newVal = min;
                cell.Value = newVal;
                cell.Table.DataGrid.FireEvent(cell.Table.DataGrid.Events.OnCellValueCorrected, [cell, CellCorrectReasons.MinValue, oldVal, newVal]);
                hadToBound = true;
            }
        }
        if (header.MaxValue != undefined) {
            let max = ParseData(header.MaxValue, cell.Header.Type);
            if (cell.Value > max) {
                let oldVal = cell.Value;
                let newVal = max;
                cell.Value = newVal;
                cell.Table.DataGrid.FireEvent(cell.Table.DataGrid.Events.OnCellValueCorrected, [cell, CellCorrectReasons.MaxValue, oldVal, newVal]);
                hadToBound = true;
            }
        }
        return !hadToBound;
    }

    function EnforceLengthsCellValue(cell) {
        if (cell.ReadOnly || cell.Row.ReadOnly || cell.Header.ReadOnly) {
            return true;
        }
        let header = cell.Header;
        if (header.Type != DataTypes.String) {
            return true;
        }
        if (header.MinLength != undefined) {
            if (cell.Value.length < header.MinLength) {
                cell.Table.DataGrid.FireEvent(cell.Table.DataGrid.Events.OnCellValueCorrected, [cell, CellCorrectReasons.MinLength, cell.Value, cell.Value]);
                return false;
            }
        }
        if (header.MaxLength != undefined) {
            if (cell.Value.length > header.MaxLength) {
                let oldVal = cell.Value;
                let newVal = cell.Value.substring(0, header.MaxLength);
                cell.Value = newVal;
                cell.Table.DataGrid.FireEvent(cell.Table.DataGrid.Events.OnCellValueCorrected, [cell, CellCorrectReasons.MaxLength, oldVal, newVal]);
                return false;
            }
        }
        return true;
    }
    function get_datatype(obj){
	   if(obj == null){
		 return DataTypes.String;
	   }
	   if(obj instanceof Object){return DataTypes.String;}
	   if(!(typeof obj == "string")){return DataTypes.String;}
	 
	   let asStr = obj.toString();
	   let strTrimLower = asStr.trim().toLowerCase();
	   if(strTrimLower == "false"){return DataTypes.Boolean;}
	   if(strTrimLower == "true"){return DataTypes.Boolean;}
	 
	   let asRound = Math.round(obj);
	   if( !Number.isNaN(asRound) ){
		 let asFloat = parseFloat(obj);
			if(!Number.isNaN(asFloat)){
				return DataTypes.Numeric;
			}
	   }
	 
	   let asDate = new Date(obj);
	   if(asDate.toString() != "Invalid Date"){return DataTypes.DateTime;}
	   
	 
	   return DataTypes.String;
	}
    function JsonArrayToValidInput(arr,hdrs){
		if(arr.length === 0){
			return {Headers:[],Rows:[]};
		}
		let headers = hdrs || [];
		let props = Object.getOwnPropertyNames(arr[0]);

		let rows = [];
		for(let r of arr){
			let row = {Cells:[]};
			let idx = 0;
			for(let prop of props){
				let val = r[prop];
				if(!headers[idx] && val != ""){
					let type = get_datatype(val);
					let header = {Name: prop, Type: type};
					headers[idx] = (header);      
				}
				let cell = {Value: val};
				row.Cells.push(cell);
				idx++;
			}
			rows.push(row);
		}
		for(let i = 0; i < props.length; i++){
			if(!headers[i]){
				headers[i] = {Name: props[i], DataType: DataTypes.Unknown};
			}
		}

		let data = {Headers:headers,Rows:rows};	
		return data;
	}
    class AjaxGrid extends DataGrid{
		constructor(dataGetter){
			super({Headers:[],Rows:[]});
			this.SortOrder = SortOrders.Asc;
			this.SortName = "";
			this.ItemsPerPage = 50;
			this._totalItems = 0;
			this.DataGetter = dataGetter;
			this.SetDataSource({Headers:[],Rows:[]});
			let scope = this;
			this._getPage();
		}
		_getPage(cb){
			let scope = this;
			let sortData = scope.SortDetails.ToJsonObject();
			let filter = scope.FilterDetails.ToJsonObject();
			let _headers = _.From(scope.Table.Headers);
			for(let cf of filter.ComplexFilters){
				for(let sf of cf.SimpleFilters){
					let header = _headers.First(x=>x.Name == sf.Name);
					if(header){
						if(sf.Type == "IN" || sf.Type == "BETWEEN"){
							let ds = sf.Query.split(",");
							sf.Query  = _.From(ds).Select(x=>{
								let rtn = ParseData(x,header.Type);
								if(header.Type == DataTypes.DateTime){
									rtn = rtn.toISOString();
								}
								return rtn;
							}).Write(",");
						} else {
							sf.Query = ParseData(sf.Query,header.Type);
						}
					}
				}
			}
			scope.DataGetter(scope.PageNumber,scope.ItemsPerPage,sortData,filter,r=>{
				let rows = r.Rows;
				let headers = r.Headers || [];
				let totalCnt = r.TotalRecords;
				this._totalItems = r.TotalRecords;
				let data = JsonArrayToValidInput(rows,headers);
				this.SetDataSource(data);
				for(let h of scope.HtmlGrids){
					h.DataBind();
				}
				if(cb){
					cb();
				}
				
			}, e=>{
				console.log(e);
			});
		}
		get TotalItems(){
			return this._totalItems;
		}
		Refresh(){
			this._getPage();
		}
		RefreshToFirstPage(){
			this.PageNumber = 0;
			this._getPage();
		}
	}

    class SortCollection extends Array{
		constructor(){
			super();
		}
		ToJsonObject(){
			let sortData = [];
			for(let sd of this){
				sortData.push({SortName: sd.Name, SortOrder: sd.Direction});
			}	
			return sortData;
		}
	}
    class FilterCollection{
		constructor(){
			this.ComplexFilters = [];
			this.Guid = CreateGuid();
			this.AddComplexFilter();
		}
		AddComplexFilter(){
			let complexFilter = new ComplexFilter(this);
			this.ComplexFilters.push(complexFilter);
			return complexFilter;
		}
		Remove(opt){
			this.ComplexFilters = _.From(this.ComplexFilters).Where(x=>x!== opt).ToArray();
		}
		ToJsonObject(){
			return {
				ComplexFilters: _.From(this.ComplexFilters).Select(x=>x.ToJsonObject()).ToArray()
			};
		}
		FindAnyFilterByGuid(guid){
			let match = this.FindComplexFilterByGuid(guid);
			if(match !== null){
				return match;
			}
			return this.FindSimpleFilterByGuid(guid);
		}
		FindComplexFilterByGuid(guid){
			return _.From(this.ComplexFilters).First(x=>x.Guid===guid);
		}
		FindSimpleFilterByGuid(guid){
			for(let cf of this.ComplexFilters){
				for(let sf of cf.SimpleFilters){
					if(sf.Guid === guid){
						return sf;
					}
				}
			}
			return null;
		}
	}
    class ComplexFilter{
		constructor(collection){
			this.SimpleFilters = [];
			this.FilterCollection = collection;
			this.Guid = CreateGuid();
		}
		Add(name,type,query,negated){
			let simpleFilter = new SimpleFilter(this,name,type,query,negated)
			this.SimpleFilters.push(simpleFilter);
			return simpleFilter;
		}
		Remove(simpleFilter){
			this.SimpleFilters = _.From(this.SimpleFilters).Where(x=>x!==simpleFilter).ToArray();
		}
		FindSimpleFilterByGuid(guid){
			return _.From(this.SimpleFilters).First(x=>x.Guid === guid);
		}
		Detach(){
			this.FilterCollection.Remove(this);
		}
		ToJsonObject(){
			return {
				SimpleFilters: _.From(this.SimpleFilters).Select(x=>x.ToJsonObject()).ToArray()
			};
		}
	}
    class SimpleFilter{
		constructor(complexFilter,name,type,query,negated){
			this.ComplexFilter = complexFilter;
			this.Guid = CreateGuid();
			this.Name = name;
			this.Type = type;
			this.Query = query;
			this.Negated = negated;
		}
		ToJsonObject(){
			return {
				Name: this.Name,
				Type: this.Type,
				Query: this.Query,
				Negated: this.Negated
			};
		}
		Detach(){
			this.ComplexFilter.Remove(this);
		}
	}
    DataGrid.Sorting = {};
    DataGrid.Sorting.SortDetail = SortDetail;
    DataGrid.Sorting.SortCollection = SortCollection;
    DataGrid.Filtering = {};
    DataGrid.Filtering.SimpleFilter = SimpleFilter;
    DataGrid.Filtering.ComplexFilter = ComplexFilter;
    DataGrid.Filtering.FilterCollection = FilterCollection;
    DataGrid.AjaxGrid = AjaxGrid;
    return DataGrid;
}))();
