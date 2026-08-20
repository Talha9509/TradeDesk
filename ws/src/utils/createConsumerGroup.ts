import { StreamClient } from '../config/redis'

export default async function createConsumerGroup(streamKey: string, groupName: string, ) {
  try {
    await StreamClient.xGroupCreate(streamKey, groupName, '0', { MKSTREAM: true })
    console.log(`Consumer group '${groupName}' created.`);
  } catch (error: any) {
      if (error.message.includes('BUSYGROUP')) {
      console.log(`Consumer group '${groupName}' already exists.`);
    } else {
      console.log(`Error creating '${groupName}'`);
      throw error;
    } 
  }
}