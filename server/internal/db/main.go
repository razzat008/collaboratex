// this package deals with the connection to mongodb database
package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func GetDatabase() (*mongo.Database, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Environment variable MONGODB_URI must be set")
	}
	db_uri := os.Getenv("MONGODB_URI")
	fmt.Print(db_uri)

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(db_uri))
	if err != nil {
		log.Fatal("Error connecting to Mongodb", err)
	}
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatal("Could not ping Mongodb:", err)
	}
	fmt.Println("Connected to Mongodb")
	database := client.Database("gollaboratex")
	fmt.Println("Database connected:", database.Name())
	return database, err
}
