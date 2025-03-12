#!/usr/bin/env python3
import os
import sys
import logging
import datetime
import socket
from pymongo import MongoClient, UpdateOne
from pymongo.errors import DuplicateKeyError

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()

# MongoDB connection details - update these with your values
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
MONGO_DB = os.environ.get('MONGO_DB', 'vpn-series-db')
TOTAL_WORKERS = int(os.environ.get('TOTAL_WORKERS', '8'))

def restore_worker_locks():
    """
    Restore the worker_locks collection with predefined worker IDs.
    This ensures all worker IDs are properly registered in the system.
    """
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        locks_collection = db["worker_locks"]
        
        logger.info(f"Connected to MongoDB: {MONGO_DB}.worker_locks")
        
        # Create a unique index on worker_id (if it doesn't exist)
        locks_collection.create_index("worker_id", unique=True)
        
        # Current timestamp for all records
        current_time = datetime.datetime.now(datetime.timezone.utc)
        
        # Get current hostname for instance_id
        instance_id = socket.gethostname()
        
        # Count existing locks
        existing_count = locks_collection.count_documents({})
        logger.info(f"Found {existing_count} existing worker locks")
        
        # Create list to hold all operations
        operations = []
        
        # Create or update lock documents for all worker IDs
        restored_count = 0
        for worker_id in range(TOTAL_WORKERS):
            try:
                # Try to insert a new lock document
                result = locks_collection.update_one(
                    {"worker_id": worker_id},
                    {"$set": {
                        "instance_id": f"restored-{instance_id}-{worker_id}",
                        "created_at": current_time,
                        "last_heartbeat": current_time,
                        "restored": True
                    }},
                    upsert=True
                )
                
                if result.upserted_id or result.modified_count > 0:
                    restored_count += 1
                    logger.info(f"Restored worker lock for worker_id {worker_id}")
            except DuplicateKeyError:
                logger.warning(f"Worker ID {worker_id} already exists, skipping")
            except Exception as e:
                logger.error(f"Error restoring worker ID {worker_id}: {e}")
        
        logger.info(f"Successfully restored {restored_count} worker locks")
        
        # Display the current state of the worker_locks collection
        all_locks = list(locks_collection.find({}, {"worker_id": 1, "instance_id": 1, "last_heartbeat": 1}))
        logger.info(f"Current worker locks ({len(all_locks)} total):")
        for lock in sorted(all_locks, key=lambda x: x.get("worker_id", 0)):
            worker_id = lock.get("worker_id", "N/A")
            instance = lock.get("instance_id", "unknown")
            last_heartbeat = lock.get("last_heartbeat", "unknown")
            logger.info(f"  Worker ID: {worker_id}, Instance: {instance}, Last Heartbeat: {last_heartbeat}")
            
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return False
    
    return True

if __name__ == "__main__":
    logger.info("Starting worker locks restoration")
    success = restore_worker_locks()
    if success:
        logger.info("Worker locks restoration completed successfully")
        sys.exit(0)
    else:
        logger.error("Worker locks restoration failed")
        sys.exit(1)