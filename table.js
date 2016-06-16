let DataGrid = (function() {

    // Enums
    let DataTypes = {
        'Boolean': "Boolean",
        'Numeric': "Numeric",
        'String': "String",
        'DateTime': "DateTime"
    };
    let SortOrders = {
        Asc: "Asc",
        Desc: "Desc"
    }
    let CellCorrectReasons = {
        MinLength: "MinLength",
        MaxLength: "MaxLength",
        MinValue: "MinValue",
        MaxValue: "MaxValue"
    }

    // Variables

    let tableBase = "<div class='data-grid' data-guid='{2}'>{3}{0}{1}{3}</div>";
    let headersBase = "<div class='data-grid-headers'><div class='data-grid-header data-grid-action-header'>Actions</div>{0}</div>";
    let rowBase = "<div class='data-grid-row' data-guid='{1}' data-table-guid='{2}'><div class='data-grid-row-actions'>{3}</div>{0}</div>";
    let cellBase = "<div class='data-grid-cell' data-guid='{1}' data-row-guid='{2}' data-table-guid='{3}'>{0}</div>";
    let headerBase = "<div class='data-grid-header' data-guid='{1}' data-table-guid='{2}'>{0}</div>";
    let checkboxBase = "<input type='checkbox' {0} {1} />";
    let textBase = "<input type='text' value='{0}' {1} />";
    let numberBase = "<input type='number' value='{0}' {1}/>";
    let dateBase = "<input type='date' value='{0}' {1}/>";
    let rowDeleteBase = "<span class='data-grid-rowdelete-btn' data-row-guid='{0}'>Delete</span>";
    let cellMaskBase = "<div class='data-grid-cell-mask' data-guid='{1}' data-row-guid='{2}' data-table-guid='{3}'>{0}</div>";
    let pagerBase = "<div class='pager' data-table-guid='{1}'>{0}</div>";
    let pagerFirstBase = '<span class="pager-first pager-control-item" data-pagenumber="0">&lt;&lt;</span>';
    let pagerLastBase = '<span class="pager-last pager-control-item" data-pagenumber="{0}">&gt;&gt;</span>';
    let pagerPrevBase = '<span class="pager-prev pager-control-item" data-pagenumber="{0}">&lt;</span>';
    let pagerNextBase = '<span class="pager-next pager-control-item" data-pagenumber="{0}">&gt;</span>';
    let pagerStatsBase = '<span class="pager-stats pager-control-item">Page: {0} of {1} | Showing records {2} - {3} of {4}</span>';



    //Classes

    function HtmlDataGrid(dataGrid) {
        this.DataGrid = dataGrid;
        this.Html = '';
        this.DomLink = null;
        this.BoundElm = null;
    }
    HtmlDataGrid.prototype.SetDataSource = function(data) {
            this.DataGrid.SetDataSource(data);
            this.ConstructHtml();
        }
        // DOM Value get/set
    HtmlDataGrid.prototype.GetElmValue = function(cell) {
        let scope = this;
        let elm = scope.DomQueryForGuid(cell.Guid);
        if (elm == null) {
            return null;
        }
        elm = elm.childNodes[0];

        if (cell.Header.Type == DataTypes.Boolean) {
            return elm.checked;
        } else if (cell.Header.Type == DataTypes.Numeric) {
            return parseFloat(elm.value);
        } else if (cell.Header.Type == DataTypes.DateTime) {
            return new Date(elm.value);
        }
        return elm.value;
    }
    HtmlDataGrid.prototype.SetElmValue = function(cell) {
        let scope = this;
        let elm = scope.DomQueryForGuid(cell.Guid);
        if (elm == null) {
            return null;
        }
        elm = elm.childNodes[0];
        if (cell.Header.Type == DataTypes.Boolean) {
            elm.checked = cell.Value;
            elm.textContent = cell.Value;
        } else if (cell.Header.Type == DataTypes.Numeric) {
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

    HtmlDataGrid.prototype.SyncCellToElm = function(cell) {
        let scope = this;
        let elm = scope.DomQueryForGuid(cell.Guid);
        if (elm == null) {
            return;
        }
        elm = elm.childNodes[0];
        if (cell.Header.Type == DataTypes.Boolean) {
            elm.checked = cell.Value;
            elm.textContent = cell.Value;
        } else if (cell.Header.Type == DataTypes.Numeric) {
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
    HtmlDataGrid.prototype.SyncElmToCell = function(elm) {
        let scope = this;
        let guid = elm.dataset.guid;
        let cell = scope.DataGrid.FindCellByCellGuid(guid);
        if (cell == null) {
            return;
        }
        elm = elm.childNodes[0];

        if (cell.Header.Type == DataTypes.Boolean) {
            cell.Value = elm.checked;
        } else if (cell.Header.Type == DataTypes.Numeric) {
            cell.Value = parseFloat(elm.value);
        } else if (cell.Header.Type == DataTypes.DateTime) {
            cell.Value = new Date(elm.value);
        } else {
            cell.Value = elm.value;
        }
    }
    HtmlDataGrid.prototype.SetCellValue = function(cell, val) {
        let scope = this;
        cell.Value = val;
        scope.SyncCellToElm(cell);
    }

    // Cell interactivity toggling
    HtmlDataGrid.prototype.SetCellInteractive = function(cell) {
        let scope = this;
        let dom = scope.DomQueryForGuid(cell.Guid);
        let interactive = CreateInteractiveCell(cell, cell.Row, cell.Header);

        function onCellBlur(e) {
            if (e.target.parentNode.className.indexOf("data-grid-cell") > -1) {
                let cell = scope.DataGrid.FindCellByCellGuid(e.target.parentNode.dataset.guid);
                scope.SetCellMask(cell);
            }
        }
        let div = document.createElement("div");
        div.innerHTML = interactive;
        let newNode = div.childNodes[0];
        dom.parentNode.replaceChild(newNode, dom);
        let input = newNode.childNodes[0];
        input.focus();
        input.onblur = onCellBlur;
        try {
            input.selectionStart = input.selectionEnd = input.value.length;
        } catch (e) {

        }
    }
    HtmlDataGrid.prototype.SetCellMask = function(cell) {
        let scope = this;
        let dom = scope.DomQueryForGuid(cell.Guid);
        let mask = CreateMaskCellHtml(cell, cell.Row, cell.Header);

        let div = document.createElement("div");
        div.innerHTML = mask;
        let newNode = div.childNodes[0];
        dom.parentNode.replaceChild(newNode, dom);

    }
    HtmlDataGrid.prototype.DomQueryForGuid = function(guid) {
        let scope = this;
        let query = StringFormat("[data-guid='{0}']", [guid]);
        let arr = scope.DomLink.querySelectorAll(query);
        if (arr.length == 0) {
            return null;
        }
        return arr[0];
    }
    HtmlDataGrid.prototype.DataBind = function() {
        let scope = this;
        scope.DomBind(scope.BoundElm);
    }
    HtmlDataGrid.prototype.DomBind = function(elm) {
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
                    if (e.target.parentNode.className.indexOf("data-grid-cell") == -1) {
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
                    if (e.target.parentNode.className.indexOf("data-grid-cell") == -1) {
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
                    if (e.target.className.indexOf("data-grid-rowdelete-btn") == -1) {
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
                    if (e.target.className.indexOf("data-grid-header") == -1) {
                        return;
                    }
                    let elm = e.target;
                    let header = grid.DataGrid.FindHeaderByHeaderGuid(elm.dataset.guid);
                    if (!header) {
                        return;
                    }
                    if (header.SortDir == undefined) {
                        header.SortDir = SortOrders.Asc;
                    }
                    let sortDir = header.SortDir;
                    grid.DataGrid.SortColumn(header.Column, header.SortDir);
                    grid.DataGrid.PageNumber = 0;
                    grid.DataBind();
                    if (sortDir == SortOrders.Asc) {
                        header.SortDir = SortOrders.Desc;
                    } else {
                        header.SortDir = SortOrders.Asc;
                    }
                });
        }

        function bindClickListener(grid) {
            grid.DomLink.addEventListener("click",
                function onCellClick(e) {
                    if (e.target.className.indexOf("data-grid-cell-mask") > -1) {
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
                function onPagerClick(e) {
                    if (e.target.className.indexOf("pager-control-item") > -1) {
                        var pagenumber = e.target.dataset.pagenumber;
                        if (e.target.className.indexOf("pager-first") > -1) {
                            grid.GoToPage(0);
                            return;
                        }
                        if (e.target.className.indexOf("pager-last") > -1) {
                            grid.GoToPage(pagenumber);
                            return;
                        }
                        if (e.target.className.indexOf("pager-prev") > -1) {
                            grid.PrevPage();
                            return;
                        }
                        if (e.target.className.indexOf("pager-next") > -1) {
                            grid.NextPage();
                            return;
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


    }
    HtmlDataGrid.prototype.ConstructHtml = function() {
        let grid = this;
        grid.Html = CreateTableHtml(grid.DataGrid.Table);
    }

    // Paging
    HtmlDataGrid.prototype.NextPage = function() {
        let scope = this;
        scope.DataGrid.NextPage();
        scope.DataBind();
    }
    HtmlDataGrid.prototype.PrevPage = function() {
        let scope = this;
        scope.DataGrid.PrevPage();
        scope.DataBind();
    }
    HtmlDataGrid.prototype.GoToPage = function(i) {
        let scope = this;
        scope.DataGrid.GoToPage(i);
        scope.DataBind();
    }

    function DataGrid(data) {
        let grid = this;
        grid.Guid = CreateGuid();
        grid.Data = data;
        grid.Sortable = true;
        grid.Deletable = true;
        grid.Addable = true;
        grid.Pageable = true;
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
        grid.PageNumber = 0;
        grid.ItemsPerPage = 999999999;
        Object.defineProperty(grid, "TotalPages", {
            get: function() {
                return Math.ceil(grid.Table.Rows.length / grid.ItemsPerPage);
            }
        });
    }

    let grid = DataGrid.prototype;
    grid.CreateHtmlGrid = function() {
        let scope = this;
        return new HtmlDataGrid(scope);
    }
    grid.BindEvent = BindEvent;
    grid.UnBindEvent = UnBindEvent;
    grid.FireEvent = FireEvent;
    grid.SortOrders = SortOrders;
    grid.DataTypes = DataTypes;
    grid.CellCorrectReasons = CellCorrectReasons;

    // Querying
    grid.FindRowByRowGuid = function(guid) {
        let scope = this;
        return scope.Table.RowHash.get(guid);
    }
    grid.FindCellByCellGuid = function(guid) {
        let scope = this;
        return scope.Table.CellHash.get(guid);
    }
    grid.FindHeaderByHeaderGuid = function(guid) {
        let scope = this;
        for (let i = 0; i < scope.Table.Headers.length; i++) {
            let header = scope.Table.Headers[i];
            if (header.Guid == guid) {
                return header;
            }
        }
    }
    grid.FindColumnByColumnGuid = function(guid) {
        let scope = this;
        let header = scope.FindHeaderByHeaderGuid(guid);
        if (!header) {
            return null;
        }
        return header.Column;
    }


    // Sorting
    grid.SortColumn = function(column, sortOrder) {
        let scope = this;
        if (!scope.Sortable) {
            return;
        }
        SortData(column.Cells, column.Header.Type, sortOrder);
        let rows = [];
        for (let i = 0; i < column.Cells.length; i++) {
            let cell = column.Cells[i];
            rows.push(cell.Row);
        }
        scope.Table.Rows = rows;
    }
    grid.OrderBy = function(comparer) {
        let scope = this;
        if (!scope.Sortable) {
            return;
        }
        return new OrderBy(scope.Table.Rows, comparer);
    }
    grid.OrderByColumn = function(column, sortOrder) {
        let scope = this;
        if (!scope.Sortable) {
            return;
        }
        return new OrderByColumn(scope.Table.Rows, column, sortOrder);
    }

    // Extending
    grid.AddRow = function() {
        let scope = this;
        if (!scope.Addable) {
            return false;
        }
        let row = new Row({
            Cells: []
        }, scope.Table);
        for (let i = 0; i < scope.Table.Headers.length; i++) {
            let header = scope.Table.Headers[i];
            let val = GetDefaultData(header.Type);
            let cell = new Cell({
                Value: val
            }, row, header);
            row.Cells.push(cell);
        }
        let rtn = FireEvent(scope.Events.OnRowAdded, [row]);
        if (IsFireEventResultFalse(rtn)) {
            return false;
        }
        scope.Table.Rows.push(row);

    }
    grid.DeleteRow = function(row) {
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
    grid.AddColumn = function(hhr) {
        let scope = this;
        if (!scope.Addable) {
            return false;
        }

        let header = new Header(hdr);
        let column = new Column(header);

        let rtn = FireEvent(scope.Events.OnColumnAdded, [column]);
        if (IsFireEventResultFalse(rtn)) {
            return false;
        }

        scope.Table.Columns.push(column);
        scope.Table.Headers.push(header);

        for (let i = 0; i < scope.Table.Rows.length; i++) {
            let row = scope.Table.Rows[i];
            let val = GetDefaultData(header.Type);
            let cell = new Cell({
                Value: val
            }, row, scope.Table);
            row.Cells[column.Index] = cell;
            column.Cells.push(cell);
        }


    }
    grid.DeleteColumn = function(column) {
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

        for (let i = 0; i < scope.Table.Rows.length; i++) {
            let row = scope.Table.Rows[i];
            row.Cells.splice(idx, 1);
        }

    }

    // Paging
    grid.NextPage = function() {
        let scope = this;
        if (scope.Pageable === false) {
            return false;
        }
        let total = scope.TotalPages;
        scope.PageNumber = Math.min(total, scope.PageNumber + 1);
        FireEvent(scope.Events.OnNextPage, [scope.PageNumber]);
    }
    grid.PrevPage = function() {
        let scope = this;
        if (scope.Pageable === false) {
            return false;
        }
        scope.PageNumber = Math.max(0, scope.PageNumber - 1);
        FireEvent(scope.Events.OnPrevPage, [scope.PageNumber]);
    }
    grid.GoToPage = function(i) {
        let scope = this;
        if (scope.Pageable === false) {
            return false;
        }
        let total = scope.TotalPages;
        scope.PageNumber = Math.min(total, i);
        scope.PageNumber = Math.max(scope.PageNumber, 0);
        FireEvent(scope.Events.OnGoToPage, [scope.PageNumber]);
    }

    // JSON Utilities
    grid.GetHeaderJSON = function() {
        let scope = this;
        let json = [];
        for (let i = 0; i < scope.Table.Headers.length; i++) {
            let header = scope.Table.Headers[i];
            let jsonHeader = HeaderToJSON(header);
            json.push(jsonHeader);
        }
        return json;
    }
    grid.GetRowsJSON = function() {
        let scope = this;
        let rows = [];
        for (let i = 0; i < scope.Table.Rows.length; i++) {
            let row = scope.Table.Rows[i];
            let jsonRow = RowToJSON(row);
            rows.push(jsonRow);
        }
        return rows;
    }
    grid.ToJSON = function() {
        let scope = this;
        let data = {};
        data.Headers = scope.GetHeaderJSON();
        data.Rows = scope.GetRowsJSON();
        return data;
    }
    grid.ToJSONString = function() {
        let scope = this;
        let json = scope.ToJSON();
        return JSON.stringify(json);
    }

    // Data Filtering/Querying
    grid.FilterRows = function(query) {
        let scope = this;
        let g = new DataGrid();
        let headers = scope.GetHeaderJSON();
        let rows = [];
        for (let i = 0; i < scope.Table.Rows.length; i++) {
            let r = scope.Table.Rows[i];
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
    grid.FilterColumn = function(column, query) {
            let scope = this;
            let g = new DataGrid();
            let headers = scope.GetHeaderJSON();
            let rows = [];
            for (let i = 0; i < column.Cells.length; i++) {
                let cell = column.Cells[i];
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
    grid.FilterColumns = function(query) {
        let scope = this;
        let g = new DataGrid();
        let headers = [];
        let rows = [];
        let indexes = [];
        for (let i = 0; i < scope.Table.Headers.length; i++) {
            let header = scope.Table.Headers[i];
            if (query(header)) {
                headers.push(HeaderToJSON(header));
                indexes.push(header.Index);
            }
        }
        for (let i = 0; i < scope.Table.Rows.length; i++) {
            let row = scope.Table.Rows[i];
            let newRow = RowToJSON(row);
            let cells = [];
            for (let j = 0; j < indexes.length; j++) {
                let idx = indexes[j];
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
    grid.SetDataSource = function(data) {
        let scope = this;
        FireEvent(scope.Events.OnDataBind, [data]);
        scope.Table = new Table(data, scope);
    }
    grid.DataBind = function() {
        let scope = this;
        scope.PageNumber = 0;
        scope.SetDataSource(scope.Table);
        //grid.DomBind(grid.BoundElm);

    }

    function Table(data, grid) {

        let scope = this;
        scope.DataGrid = grid;
        grid.Table = scope;

        scope.Headers = ExtractHeaders(data.Headers);
        scope.Columns = ExtractColumns(scope.Headers);
        scope.Rows = ExtractRows(data.Rows);

        function ExtractHeaders(headers) {
            let rtn = [];
            for (let i = 0; i < headers.length; i++) {
                let header = headers[i];
                rtn.push(new Header(header, i, scope));
            }
            return rtn;
        }

        function ExtractColumns(headers) {
            let rtn = [];
            for (let i = 0; i < headers.length; i++) {
                let header = headers[i];
                rtn.push(new Column(header));
            }
            return rtn;
        }

        function ExtractRows(rows) {
            let rtn = [];
            for (let i = 0; i < rows.length; i++) {
                let rowProto = rows[i];
                let row = new Row(rowProto, scope);
                if (row === null) {
                    continue;
                }
                rtn.push(row);
            }
            return rtn;
        }
    }

    function Header(header, index, table) {
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

    function Column(header) {
        let column = {
            Header: header,
            Index: header.Index,
            Guid: header.Guid,
            Cells: []
        }
        header.Column = column;
        return column;
    }

    function Row(row, table) {
        let scope = this;
        scope.Data = row.Data;
        scope.ReadOnly = row.ReadOnly;
        scope.Deletable = row.Deletable;
        let headers = table.Headers;
        let cells = row.Cells;

        scope.Table = table;
        scope.Headers = table.Headers;

        scope.Cells = [];

        for (let i = 0; i < cells.length; i++) {
            let cellProto = cells[i];
            let header = scope.Headers[i];
            let cell = new Cell(cellProto, scope, header);
            scope.Cells.push(cell);
        }

        let rtns = FireEvent(scope.Table.DataGrid.Events.OnRowDataBind, [scope]);
        if (IsFireEventResultFalse(rtns)) {
            return null;
        }

    }

    function Cell(cell, row, header) {
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

    function Pager(totalItems, pageNumber, itemsPerPage) {
        this.TotalItems = totalItems;
        this.PageNumber = pageNumber;
        this.ItemsPerPage = itemsPerPage;
    }
    Object.defineProperty(Pager.prototype, "TotalPages", {
        get: function TotalPages() {
            return Math.ceil(this.TotalItems / this.ItemsPerPage);
        }
    });
    Object.defineProperty(Pager.prototype, "PageNumberOneBased", {
        get: function PageNumberOneBased() {
            return this.PageNumber + 1;
        }
    });
    Object.defineProperty(Pager.prototype, "LastPageOneBased", {
        get: function LastPageOneBased() {
            return this.LastPage + 1;
        }
    });
    Object.defineProperty(Pager.prototype, "PreviousPage", {
        get: function PreviousPage() {
            if (this.HasPreviousPage === false) {
                return null;
            }
            return this.PageNumber - 1;
        }
    });
    Object.defineProperty(Pager.prototype, "NextPage", {
        get: function NextPage() {
            if (this.HasNextPage == false) {
                return null;
            }
            return this.PageNumber + 1;
        }
    });
    Object.defineProperty(Pager.prototype, "LastPage", {
        get: function LastPage() {
            return this.TotalPages - 1;
        }
    });
    Object.defineProperty(Pager.prototype, "HasNextPage", {
        get: function HasNextPage() {
            return this.TotalPages > 0 && this.PageNumber < this.LastPage;
        }
    });
    Object.defineProperty(Pager.prototype, "HasPreviousPage", {
        get: function HasPreviousPage() {
            return this.TotalPages > 0 && this.PageNumber > 0;
        }
    });
    Object.defineProperty(Pager.prototype, "IsPageNumberValid", {
        get: function IsPageNumberValid() {
            return this.PageNumber >= 0 && this.PageNumber < this.TotalPages;
        }
    });
    Object.defineProperty(Pager.prototype, "StartingItemIndex", {
        get: function StartingItemIndex() {
            if (this.TotalItems == 0 || this.IsPageNumberValid == false) {
                return null;
            }
            return (this.PageNumber * this.ItemsPerPage) + 1;
        }
    });
    Object.defineProperty(Pager.prototype, "EndingItemIndex", {
        get: function EndingItemIndex() {
            if (this.TotalItems == 0 || this.IsPageNumberValid == false) {
                return null;
            }
            var idx = (this.PageNumber * this.ItemsPerPage) + this.ItemsPerPage;
            return Math.min(this.TotalItems, idx);
        }
    });

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
        if (eventProp.length === 0) {
            return [];
        }
        let rtns = [];
        for (let i = 0; i < eventProp.length; i++) {
            let action = eventProp[i];
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

    // Sorting
    function OrderBy(data, comparer) {
        return new ThenBy(data, comparer);
    }

    function ThenBy(data, comparer) {
        let tb = {};
        tb.Data = data;
        tb.Comparer = comparer;
        tb.Execute = function() {
            return tb.Data.sort(tb.Comparer);
        }
        tb.ThenBy = function(comparer2) {
            return new ThenBy(tb.Data, function(a, b) {
                return tb.Comparer(a, b) || comparer2(a, b);
            });
        }
        return tb;
    }

    function OrderByColumn(rows, column, sortOrder) {
        return new ThenByColumn(rows, column, sortOrder);
    }

    function ThenByColumn(rows, column, sortOrder) {
        let tb = {};
        tb.Rows = rows;
        if (column.Type != DataTypes.String) {
            if (sortOrder == SortOrders.Asc) {
                tb.Comparer = function(a, b) {
                    return a.Cells[column.Index].Value - b.Cells[column.Index].Value;
                }
            } else {
                tb.Comparer = function(b, a) {
                    return a.Cells[column.Index].Value - b.Cells[column.Index].Value;
                }
            }
        } else {
            if (sortOrder == SortOrders.Asc) {
                tb.Comparer = function(a, b) {
                    let val1 = a.Cells[column.Index].Value;
                    let val2 = b.Cells[column.Index].Value;
                    if (val1 < val2) {
                        return -1;
                    }
                    if (val1 > val2) {
                        return -1;
                    }
                    return 0;
                }
            } else {
                tb.Comparer = function(b, a) {
                    let val1 = a.Cells[column.Index].Value;
                    let val2 = b.Cells[column.Index].Value;
                    if (val1 < val2) {
                        return -1;
                    }
                    if (val1 > val2) {
                        return -1;
                    }
                    return 0;
                }
            }
        }

        tb.Execute = function() {
            return tb.Rows.sort(tb.Comparer);
        }
        tb.ThenByColumn = function(column, sortOrder) {
            let tb2 = new ThenByColumn(tb.Rows, column, sortOrder);
            let tb2Comparer = tb2.Comparer;
            tb2.Comparer = function(a, b) {
                return tb.Comparer(a, b) || tb2Comparer(a, b);
            }
            return tb2;
        }
        return tb;
    }

    function SortStringData(data, sortOrder) {
        if (sortOrder == SortOrders.Asc) {
            data.sort(function(a, b) {
                if (a.Value < b.Value)
                    return -1;
                if (a.Value > b.Value)
                    return 1;
                return 0;
            });
        } else {
            data.sort(function(a, b) {
                if (a.Value < b.Value)
                    return 1;
                if (a.Value > b.Value)
                    return -1;
                return 0;
            });
        }
    }

    function SortData(data, type, sortOrder) {
        if (type == DataTypes.String) {
            SortStringData(data, sortOrder);
            return;
        }

        if (sortOrder == SortOrders.Asc) {
            data.sort(function(a, b) {
                return a.Value - b.Value;
            });
        } else {
            data.sort(function(a, b) {
                return b.Value - a.Value;
            });
        }
    }

    // Parsing
    function ParseData(value, dataType) {
        if (dataType == DataTypes.String) {
            return value;
        }
        if (dataType == DataTypes.Numeric) {
            return parseFloat(value);
        }
        if (dataType == DataTypes.DateTime) {
            return new Date(value);
        }
        if (dataType == DataTypes.Boolean) {
            return !!value;
        }
    }

    function GetDefaultData(dataType) {
        if (dataType == DataTypes["String"]) {
            return "";
        }
        if (dataType == DataTypes.Numeric) {
            return 0;
        }
        if (dataType == DataTypes.Boolean) {
            return false;
        }
        if (dataType == DataTypes.DateTime) {
            return new Date();
        }
        return null;
    }

    // Utilities
    function TimeAction(action) {
        let a = Date.now();
        action();
        let b = Date.now();
        console.log("Action took ", b - a, "ms");
    }

    function StringFormat(str, objects) {
        let rtn = str;
        for (let i = 0; i < objects.length; i++) {
            let find = "{" + i + "}";
            rtn = rtn.split(find).join(objects[i]);
        }
        return rtn;
    }
    let alphabetString = "abcdefghijklmnnopqrstuvwxyz0123456789";
    let alphabet = alphabetString.split("");
    let alphaLen = alphabet.length;

    function CreateGuid() {
        let guidLen = 20;
        let cnt = 0;
        let guid = "";
        while (guidLen) {
            if (cnt === 4) {
                guid = guid + "-";
                cnt = 0;
            }
            guid = guid + alphabet[(alphaLen * Math.random()) | 0]
            guidLen--;
            cnt++;

        }
        return guid;
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
        for (let i = 0; i < row.Cells.length; i++) {
            let cell = row.Cells[i];
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


        let pagerHtml = CreatePagerHtml(data);

        let headers = CreateHeadersHtml(data);
        let rows = CreateRowsHtml(data);
        let table = StringFormat(tableBase, [headers, rows, data.Guid, pagerHtml]);

        return table;
    }

    function CreatePagerHtml(data) {
        if (!data.DataGrid.Pageable) {
            return "";
        }

        let pager = new Pager(data.Rows.length, data.DataGrid.PageNumber, data.DataGrid.ItemsPerPage);
        let innerHtml = "";
        if (pager.HasPreviousPage) {
            innerHtml += pagerFirstBase;
            innerHtml += StringFormat(pagerPrevBase, [pager.PreviousPage]);
        }
        if (pager.HasNextPage) {
            innerHtml += StringFormat(pagerNextBase, [pager.NextPage]);
            innerHtml += StringFormat(pagerLastBase, [pager.LastPage]);
        }

        if (pager.TotalItems > 0) {
            innerHtml += StringFormat(pagerStatsBase, [pager.PageNumberOneBased, pager.LastPageOneBased, pager.StartingItemIndex, pager.EndingItemIndex, pager.TotalItems]);
        }

        let pagerHtml = StringFormat(pagerBase, [innerHtml, data.Guid]);
        return pagerHtml;


    }

    function CreateColumns(data) {
        data.Columns = [];
        for (let i = 0; i < data.Headers.length; i++) {
            let header = data.Headers[i];
            let column = new Column(header);
            data.Columns.push(column);
        }
    }

    function CreateHeadersHtml(data) {

        let headers = data.Headers;
        let headerCells = "";
        for (let i = 0; i < headers.length; i++) {
            let header = headers[i];
            let headerCell = StringFormat(headerBase, [header.Name, header.Guid, data.Guid]);
            headerCells += headerCell;
        }

        let base = headersBase;
        let headerRow = StringFormat(base, [headerCells]);

        return headerRow;
    }

    // Row Creation Helpers
    function CreateRowsHtml(data) {

        let rows = data.Rows;
        let rowsHtml = "";
        let startRow = (data.DataGrid.PageNumber * data.DataGrid.ItemsPerPage);
        let endRow = Math.min(rows.length, (data.DataGrid.PageNumber + 1) * data.DataGrid.ItemsPerPage);
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
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            let header = headers[i];
            let rowCell = CreateCellHtml(cell, row, header);
            rowCells += rowCell;
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
        cell.Table.CellHash.set(cell.Guid, cell);
        return CreateMaskCellHtml(cell, row, header);
    }

    function CreateInteractiveCell(cell, row, header) {
        if (header.Type == DataTypes.Boolean) {
            return CreateBooleanCellHtml(cell, row, header);
        } else if (header.Type == DataTypes.Numeric) {
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
        let rowCell = StringFormat(cellBase, [StringFormat(textBase, [cell.Value, readOnly]), cell.Guid, cell.RowGuid, cell.TableGuid]);
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



    return DataGrid;

})();
