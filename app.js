const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model('Item', itemsSchema);


mongoose.connect("mongodb://localhost:27017/todolistDB")

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({}).exec();
      if(foundItems.length === 0){

            console.log("Connected to MongoDB");
            return Item.insertMany([
              { name: "Welcome to your ToDo list" },
              { name: "Pray" },
              { name: "Read the bible" },
              { name: "Read my books" }
            ]);

            console.log("Successfully saved default items to DB");

            console.error('Error connecting to MongoDB:', error);
              res.redirect("/");
      }else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (!foundList) {
      console.log("Doesn't exist");

      const list = new List({
        name: customListName,
        items: []
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      console.log("Exists");
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (error) {
    console.error('Error finding list:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  try {
    const foundList = await List.findOne({ name: listName }).exec();

    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      foundList.items.push(item); // Corrected the property name from 'item' to 'items'
      await foundList.save();
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error('Error finding list:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/delete", async function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  try {
    if (listName === "Today") {
      await Item.findOneAndDelete({ _id: checkedItemID });
      console.log("Successfully deleted item");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}});
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Internal Server Error');
  }
});


process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB disconnected through app termination');
    process.exit(0);
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
