const express = require('express')
const axios = require('axios')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const dbPath = path.join(__dirname, 'productsData.db')
const app = express()

app.use(express.json())
let db
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running')
    })
  } catch (error) {
    console.log(error)
  }
}
initializeDbAndServer()

//I wrote this logic for sending data to a url without creating database
/*app.get('/getdetails', async (req, res) => {
  const {serachinput = '', monthquery = 3} = req.query
  try {
    const apiData = await axios.get(url)
    const {data} = apiData

    const filterData = data.filter(
      each => new Date(each.dateOfSale).getMonth() + 1 === monthquery,
    )
    res.json(filterData)
  } catch (error) {
    console.log(error.message)
  }
})*/

app.post('/postData', async (req, res) => {
  try {
    const {id, title, price, description, category, image, sold, dateOfSale} =
      req.body

    const postQuery = `insert into products(id,title,price,description,category,image,sold,dateOfSale)
  values(?,?,?,?,?,?,?,?)`
    await db.run(postQuery, [
      id,
      title,
      price,
      description,
      category,
      image,
      sold,
      dateOfSale,
    ])
    res.send({id: id})
  } catch (error) {
    console.log(error)
  }
})

app.get('/getData', async (req, res) => {
  try {
    const {searchText = '', pagnation = 0, month = 3} = req.query
    const sqlQ = `select * from products
     where
     cast(strftime("%m",dateOfSale) as interger)= ${month} and 
     (title like "${searchText}%" or category like '${searchText}%')
     order by id
     limit 10
      offset ${pagnation}`
    const table = await db.all(sqlQ)
    const sqlStatic = `select sum(price) as totalPrice,count( CASE
    WHEN sold = true THEN 1
    END) as totalSold,
    count(CASE
    WHEN sold=false
    then 1
    end) as totalNotSold
     from products
      where
       sold = true
        and
         CAST(strftime("%m",dateOfSale) as integer) = ${month}`
    const staic = await db.all(sqlStatic)

    const graph = `select  DISTINCT count(title) as numberOfItems,
     case
    when price <= 100 then "0-100"
    when price >100 and price <200 then "101 - 200"
    when price > 200 and price <300 then "201 - 300"
    when price > 300 and price <400 then "301 - 400"
    when price >400 and price <500 then "401 - 500"

    when price >=500 and price <=600 then "501 - 600"
    when price >600 and price <700 then "601 - 700"
    when price > 700 and price <800 then "701 - 800"
    when price >800 and price <900 then "801 - 900"
     else "900 above"
     end as priceRange
     from products
    where sold= true
    group by priceRange
   
    `
    const barGraph = await db.all(graph)

    res.send({table, staic, barGraph})
  } catch (error) {
    console.log(error)
  }
})

module.exports=app
