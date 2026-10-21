import axios from "axios";

export const emitEventHandler = async (
  event: string,
  data: any,
  socketId?: string,
) => {
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/notify`, {
      socketId,
      event,
      data,
    });
  } catch (error) {
    console.error("Error emitting event:", error);
  }
};
