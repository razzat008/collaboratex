/*
 * This file contains all the necessary features for collaboration setup *
 * This dosen't contains the code related to cursor positioning and all 
 * It works with CRDT and merging of document and all
 */
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs"
import { WebsocketProvider } from 'y-websocket';


export function useCollaboration(roomName: string, serverUrl: string){ 
	const { ydoc, provider } = useMemo(() => {
		const doc = new Y.Doc();
		const p = new WebsocketProvider(serverUrl, roomName, doc);
		return { ydoc: doc, provider: p };
	}, [roomName, serverUrl]);

	const [connected, setConnected] = useState(false);

	useEffect(() => {
		provider.on("status", (event: any) => {
			setConnected(event.status === "connected");
		});
		return () => {
			provider.disconnect();
			ydoc.destroy();
		};
	}, [provider, ydoc]);

	return { ydoc, provider, connected };
}

