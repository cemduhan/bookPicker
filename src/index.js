'use strict';

const puppeteer = require('puppeteer')
var inquirer = require('inquirer');


class Crawler {

  constructor() {
    this.page
    this.browser
    this.defaultOptions = {
      headless: false,
    };
    
    this.amazonOptions = {
      headless: false,
    };
  }

  delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

 createBrowser(browserOptions){
  return new Promise(function(resolve,reject) { 
      if (browserOptions == null){
        browserOptions = this.defaultOptions
      }

      try{
        this.browser = await puppeteer.launch(this.defaultOptions);
        resolve()
      }catch (error){
        reject(error)
      }           
  });
 }

 closeBrowser(){
  return new Promise(function(resolve,reject) {
      try{
        this.browser.close()
        resolve()
      }catch (error){
        reject(error)
      }           
  });
 }

 createPage(){
  return new Promise(function(resolve,reject) {
    try{
      this.page = await this.browser.newPage();
    }catch (error){
      reject(error)
    }     
    resolve(this.page)
  });
 }

  crawlforGenres() {
    return new Promise((resolve, reject) => {      
      (async () => {
        try
        {
          await this.createBrowser()
          await this.createPage()

          await this.page.goto('https://www.goodreads.com/choiceawards/best-books-2020')
          this.page.waitForSelector('img')

          const lis = await this.page.$$eval('.category__copy', names => names.map(name => name.textContent));


          var resultArr = lis.map(function(x){return x.replace(/\n/g, '');});

          resolve(resultArr)

        }catch(error){
          reject(error)
        }        
      })();      
    });    
  }

  crawlforBookname(genreName){
    return new Promise((resolve, reject) => {      
      (async () => {
        try{
          const values = await this.page.$$('.category__copy');

          for (var i=0; i < values.length; i++) {
  
            let valueHandle = await values[i].getProperty('innerText');
            let linkText = await valueHandle.jsonValue();
  
            if(linkText == genreName)
            {            
  
              let parent = (await values[i].$x('..'))[0]; // Element Parent
  
              let bookName = await parent.$eval('.category__winnerImage', el => el.getAttribute('alt'));
  
              resolve(bookName)
            }
          }

          this.closeBrowser();
  
          resolve(values)
        }catch(error){
          reject(error)
        }        
      })();      
    });    
  }


  addToCart(bookName){
    return new Promise((resolve, reject) => {      
      (async () => {

        try{
          await this.createBrowser(this.amazonOptions);
        
          await this.createPage();
  
          await this.page.goto('https://www.amazon.com')        
  
          await this.page.type('#twotabsearchtextbox', bookName)
  
          await this.page.click('input.nav-input')
  
          await this.page.keyboard.press('Enter');
  
          await this.delay(4000);
  
          await (await this.page.$('a.a-link-normal.a-text-normal')).click()
  
          await this.delay(4000);
  
          await (await this.page.$('#add-to-cart-button')).click()
  
          await this.delay(4000);
  
          await (await this.page.$('#nav-cart')).click()
  
          await this.delay(4000);
  
          await (await this.page.$('#sc-buy-box-ptc-button')).click()
  
          resolve()
        }catch(error){
          reject(error)
        }        
      })();      
    });    
  }
}

class main{

    async selectABook()
    {

      let greeter = new Crawler();
      let genreList = await greeter.crawlforGenres();
      let genre

      await inquirer
      .prompt(
        {
          type: 'list',
          name: 'selection',
          message: 'Please Select a Genre',
          choices: genreList,
        }    
      )
      .then((answers) => {
        genre = answers
      })
      .catch((error) => {
        if (error.isTtyError) {
        } else {
        }
      });

      console.log("Book Genre: " + genre.selection)

      let bookName = await greeter.crawlforBookname(genre.selection);

      console.log("Book Name: " + bookName)

      await greeter.addToCart(bookName);      
    }
}

let bookSelector = new main();
bookSelector.selectABook();



  