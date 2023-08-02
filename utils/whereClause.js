class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }
  search() {
    const searchWord = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $option: "i",
          },
        }
      : {};
    console.log({ searchWord });
    this.base = this.base.find({ ...searchWord });
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    delete copyQ["search"];
    delete copyQ["page"];
    delete copyQ["limit"];

    // convert bigQ into string => copyQ
    let stringofCopyQ = JSON.stringify(copyQ);
    stringofCopyQ = stringofCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfCopyQ = JSON.parse(stringofCopyQ);
    this.base = this.base.find(jsonOfCopyQ);
    console.log({ base: this.base });
    return this;
  }

  pager(resultperPage) {
    let currentpage = 1;
    if (this.bigQ.page) {
      currentpage = this.bigQ.page;
    }

    const skipVal = resultperPage * (currentpage - 1);
    this.base = this.base.limit(resultperPage).skip(skipVal);
    return this;
  }
}

module.exports = WhereClause;
