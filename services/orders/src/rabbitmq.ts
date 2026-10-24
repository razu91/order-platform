import amqp, { type Channel, type ChannelModel } from "amqplib";

const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? "orders.events";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
    
  const url = process.env.RABBITMQ_URL;

  if (!url) {
    throw new Error("RABBITMQ_URL is not configured");
  }

  const newConnection = await amqp.connect(url);
  const newChannel = await newConnection.createChannel();

  await newChannel.assertExchange(EXCHANGE, "topic", {
    durable: true,
  });

  connection = newConnection;
  channel = newChannel;

  console.log("Connected to RabbitMQ");
}

export async function publishOrderCreated(order: {
  id: string;
  customer_id: string;
  status: string;
  total_amount: string | number;
  created_at: string | Date;
  updated_at: string | Date;
}): Promise<void> {
  if (!channel) {
    throw new Error("RabbitMQ channel is not connected");
  }

  const published = channel.publish(
    EXCHANGE,
    "order.created",
    Buffer.from(JSON.stringify({
      eventId: crypto.randomUUID(),
      eventType: "order.created",
      occurredAt: new Date().toISOString(),
      data: order,
    })),
    {
      persistent: true,
      contentType: "application/json",
    },
  );

  if (!published) {
    await new Promise<void>((resolve) => channel!.once("drain", resolve));
  }
}

export async function closeRabbitMQ(): Promise<void> {
  
    const currentChannel = channel;
    const currentConnection = connection;

    channel = null;
    connection = null;

    await currentChannel?.close();
    await currentConnection?.close();
}
