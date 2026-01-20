// this package deals with the connection to mongodb database
package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func GetDatabase() (*mongo.Client, *mongo.Database, error) {
	// Load environment variables (if any)
	if err := godotenv.Load(); err != nil {
		return nil, nil, fmt.Errorf("environment variable MONGODB_URI must be set")
	}
	dbURI := os.Getenv("MONGODB_URI")
	fmt.Print(dbURI)

	// Create a context with timeout for ping operations (used for verifying connection)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Prepare client options and connect.
	// In mongo-driver v2 the Connect signature expects client options as the primary argument.
	// We call Connect with the prepared options and then use a context to Ping the server.
	clientOpts := options.Client().ApplyURI(dbURI)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		return nil, nil, fmt.Errorf("error connecting to mongodb: %w", err)
	}

	// Verify connection with a ping
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		return nil, nil, fmt.Errorf("could not ping mongodb: %w", err)
	}

	fmt.Println("Connected to Mongodb")
	database := client.Database("gollaboratex")
	fmt.Println("Database connected:", database.Name())

	return client, database, nil
}
