import AsyncStorage from "@react-native-async-storage/async-storage"
import { createAsyncStorageDurableStore } from "@/lib/AsyncStorageDurableStore"

export const expoDurableStore = createAsyncStorageDurableStore(AsyncStorage)
