var IncomeCalculator = function() {
  var self = this;

  //this.VAT = 0.16;
  this.VAT = 0;

  function TaxBand(marginalRate, baseAmount, threshold, limit) {
    this.marginalRate = marginalRate;
    this.baseAmount = baseAmount;
    this.threshold = threshold;
    this.limit = (arguments.length > 3) ? this.limit = limit : this.limit = Number.POSITIVE_INFINITY;
  }

  // Tanzania Tax bands
  this.TAX_TABLE = [
    new TaxBand(0.00, 0, 170000),
    new TaxBand(0.09, 170000, 360000),
    new TaxBand(0.20, 360000, 540000),
    new TaxBand(0.25, 540000, 720000),
    new TaxBand(0.30, 720000, 10000000),

  ];

  this.PRIMARY_REBATE = 1162;  //tax relief to be confirmed

  // Budget revenue streams from individuals (billions)
  this.PERSONAL_INCOME_TAX_REVENUE = 31712;
  //this.VAT_REVENUE = 19.4;

  // Budget expenditure by category, in millions
  // see https://docs.google.com/spreadsheets/d/18pS6-GXmV2AE6TqKtYYzL6Ag-ZuwiE4jb53U9heWF1M/edit#gid=0

  // Categorised expenditure (should, but doesn't have to, total to CONSOLIDATED_EXPENDITURE)
  
  // Tanzania categorised expenditure.
   if(lang.currentLang == "sw"){
    this.EXPENDITURE = {
      'Fedha' : (11752.2 *  Math.pow(10,9)),
      'TAMISEMI' : (6578.6 *  Math.pow(10,9)),
      'Usafiri na Habari' : (4516.9 *  Math.pow(10,9)),
      'Jeshi' : (1725.5 *  Math.pow(10,9)),
      'Elimu' : (1366.7 *  Math.pow(10,9)),
      'Afya' : (1115.6 *  Math.pow(10,9)),
      'Nishati na Madini': (998.3 *  Math.pow(10,9)),
      'Mambo ya Ndani' : (930.4 *  Math.pow(10,9)),
      'Demokrasia na Utawala Bora' : (821.3 *  Math.pow(10,9)),
      'Maji' : (672.2 *  Math.pow(10,9)),
      'Kilimo Ufugaji na Uvuvi' : (267.9 *  Math.pow(10,9)),
      'Ofisi ya Waziri Mkuu' : (171.7 *  Math.pow(10,9)),
      'Utalii' : (148.6 *  Math.pow(10,9)),
      'Viwanda na Biashara' : (122.2 *  Math.pow(10,9)),
      'Bunge' : (121.7 *  Math.pow(10,9)),
      'Ardhi' : (70.8 *  Math.pow(10,9)),
      'Michezo' : (28.2 *  Math.pow(10,9)),
      'Ofisi ya Makamu wa Raisi' : (15 *  Math.pow(10,9))
      //'Makamu wa Raisi' : (4.9 *  Math.pow(10,9))
    };

    // override ordering
    this.ORDERING = {
      'Kazi Kwa Ajili Yako Mwenyewe': 9999
    };
  }
  else{
    this.EXPENDITURE = {
      'Finance' : (11752.2 *  Math.pow(10,9)),
      'TAMISEMI' : (6578.6 *  Math.pow(10,9)),
      'Transport and Communication' : (4516.9 *  Math.pow(10,9)),
      'Army' : (1725.5 *  Math.pow(10,9)),
      'Education' : (1366.7 *  Math.pow(10,9)),
      'Health' : (1115.6 *  Math.pow(10,9)),
      'Energy and Minerals': (998.3 *  Math.pow(10,9)),
      'Internal Affairs' : (930.4 *  Math.pow(10,9)),
      'Democracy and Good Governance' : (821.3 *  Math.pow(10,9)),
      'Water' : (672.2 *  Math.pow(10,9)),
      'Agriculture Livestosk and Fisheries' : (267.9 *  Math.pow(10,9)),
      'Prime Minister Office' : (171.7 *  Math.pow(10,9)),
      'Tourism' : (148.6 *  Math.pow(10,9)),
      'Industries and Business' : (122.2 *  Math.pow(10,9)),
      'Parliament' : (121.7 *  Math.pow(10,9)),
      'Lands' : (70.8 *  Math.pow(10,9)),
      'Sports' : (28.2 *  Math.pow(10,9)),
      'Vice President Office' : (15 *  Math.pow(10,9))
      //'Vice President' : (4.9 *  Math.pow(10,9))
    };

    // override ordering
    this.ORDERING = {
      'Working for yourself': 9999
    };
  }

  // Total budget expenditure
  this.CONSOLIDATED_EXPENDITURE = _.reduce(_.values(this.EXPENDITURE), function(t, n) { return t + n; }, 0);

  // fraction of budget line items that are funded through
  // personal tax and VAT
  this.TAXPAYER_RATIO = (this.PERSONAL_INCOME_TAX_REVENUE) / this.CONSOLIDATED_EXPENDITURE;

  // start of day as a moment.js object. The date is irrelevant.
  this.START_OF_DAY = moment().hour(8).minute(0).second(0);

  this.WORKDAY_HOURS = 8;
  this.WORKDAY_MINS = this.WORKDAY_HOURS * 60;
  //let's make sure the day ends at 5pm by adding 60 minutes to the 480 WORKDAY_MINS.
  this.END_OF_DAY = this.START_OF_DAY.clone().add(this.WORKDAY_MINS + 60, 'minutes');

  this.calculateIncomeBreakdown = function(income) {
    var info = {};

    info.income = income;
    info.currentLang = lang.currentLang;

    // income tax
    info.incomeTax = self.incomeTax(info);

    // after tax income
    info.netIncome = income - info.incomeTax;

    // VAT calculated on net income
    info.vatTax = self.vatTax(info);

    // total personal tax
    info.personalTax = info.incomeTax + info.vatTax;

    // income after tax and VAT
    info.disposableIncome = income - info.personalTax;

    // fraction of day spent working for yourself
    info.personal_fraction = info.disposableIncome / info.income;
    // times spent working for yourself
    info.personal_minutes = info.personal_fraction * self.WORKDAY_MINS;
    // times spent working for the man
    info.taxman_minutes = self.WORKDAY_MINS - info.personal_minutes;
    // fraction of day spent working for the man
    info.taxman_fraction = 1 - info.personal_fraction;

    info.breakdown = this.doBreakdown(info);

    // time spent working for myself
    info.breakdown.push(this.workingForSelf(info));
    
    // sort
    info.breakdown = _.sortBy(info.breakdown, function(b) {
      return self.ORDERING[b.name] || -b.fraction;
    });

    // add times of day
    this.addTimesOfDay(info.breakdown);

    return info;
  };

  this.incomeTax = function(info) {
    var gross_income_tax = 0

    // Tanzania Tax calculation formula
    if(info.income <= 170000){
      gross_income_tax = 0;
    }
    else if(info.income > 170000 && info.income <= 360000){
      gross_income_tax = (info.income - 170000) * 0.09;
    }
    else if(info.income > 360000 && info.income <= 540000){
      gross_income_tax = 17100 + ((info.income - 360000) * 0.20);
    }
    else if(info.income > 540000 && info.income <= 720000){
      gross_income_tax = 53100 + ((info.income - 540000) * 0.25);
    }
    else if(info.income > 720000){
      gross_income_tax = 98100 + ((info.income - 720000) * 0.30);
    }

    return gross_income_tax;
  };

  this.vatTax = function(info) {
    return info.netIncome * this.VAT / (1 + this.VAT);
  };

  this.workingForSelf = function(info) {
    return {
      name: lang.currentLang == "sw" ? "Kazi Kwa Ajili Yako Mwenyewe" : "Working for yourself",
      amount: info.income,
      taxpayer_amount: info.disposableIncome,
      fraction: info.personal_fraction,
      minutes: info.personal_minutes,
    };
  };

  this.doBreakdown = function(info) {
    return _.map(this.EXPENDITURE, function(amount, category) {
      // scale amount to that contributed by personal taxpayers
      var taxpayer_amount = self.TAXPAYER_RATIO * amount;
      var fraction = amount / self.CONSOLIDATED_EXPENDITURE * info.taxman_fraction;

      return {
        name: category,
        // absolute amount from budget
        amount: amount,
        // amount contributed by the taxpayer
        taxpayer_amount: taxpayer_amount,
        // fraction of time spent on this amount
        fraction: fraction,
        // minutes per day spent on this amount
        minutes: self.WORKDAY_MINS * fraction,
      };
    });
  };

  this.addTimesOfDay = function(cats) {
  	//let us have an hour long lunch from 13:00
  	var startlunch = this.START_OF_DAY.clone().add(5, 'hours');
  	
  	var endlunch = startlunch.clone().add(1, 'hours');
  	
    var time = this.START_OF_DAY;

    _.each(cats, function(cat) {
      // time of day when you FINISH working for this category
      	time = time.clone().add(cat.minutes, 'm');
      
      
      if (time.isAfter(endlunch)){
      	//if activity comes up after lunch hour, let's account for the one hour lunch break. 
      	time = time.clone().add(1, 'hours');
     	cat.finish_time = time.clone();
      	cat.finish_time_s = time.format('h:mm a');
      }else{
      	cat.finish_time = time.clone();
      	cat.finish_time_s = time.format('h:mm a');
      }
    });
  };
};
