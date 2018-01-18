function MangaPagingViewModel() {
    this.list = [];
    this.pageSize = 0;
    this.pageIndex = 0;
    this.total = 0;
    this.keyword = '';
    this.category = ''
    this.skip = 0;
}

module.exports = MangaPagingViewModel;

MangaPagingViewModel.prototype.fill = function (model) {
    this.pageSize = model.pageSize;
    this.pageIndex = model.pageIndex;
    this.total = model.total;
    this.keyword = model.keyword;
    this.category = model.category;
    this.skip = ((this.pageIndex - 1) * this.pageSize);
}