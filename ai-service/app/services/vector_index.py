import json
import logging
import os

import faiss
import numpy as np

logger = logging.getLogger(__name__)

DIMENSION = 384  # all-MiniLM-L6-v2 output dimension
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
INDEX_FILE = os.path.join(DATA_DIR, "faiss.index")
IDS_FILE = os.path.join(DATA_DIR, "profile_ids.json")


class VectorIndex:
    def __init__(self):
        self.index = faiss.IndexFlatIP(DIMENSION)
        self.profile_ids: list[str] = []
        # Store raw vectors so we can rebuild without needing original data
        self._vectors: list[list[float]] = []
        self._load()

    def add(self, profile_id: str, vector: list[float]):
        if profile_id in self.profile_ids:
            # Update existing — remove old entry, add new one
            idx = self.profile_ids.index(profile_id)
            self.profile_ids.pop(idx)
            self._vectors.pop(idx)
            self._rebuild_faiss()

        self._vectors.append(vector)
        self.profile_ids.append(profile_id)
        vec = np.array([vector], dtype=np.float32)
        self.index.add(vec)
        logger.debug("Profile %s in index (total: %d)", profile_id, len(self.profile_ids))
        self._save()

    def search(self, query_vector: list[float], top_k: int) -> list[tuple[str, float]]:
        if self.index.ntotal == 0:
            return []
        q = np.array([query_vector], dtype=np.float32)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if 0 <= idx < len(self.profile_ids):
                results.append((self.profile_ids[idx], float(score)))
        return results

    def rebuild(self, entries: list[tuple[str, list[float]]]):
        self.profile_ids = [e[0] for e in entries]
        self._vectors = [e[1] for e in entries]
        self._rebuild_faiss()
        logger.info("Index rebuilt with %d profiles", len(self.profile_ids))
        self._save()

    def _rebuild_faiss(self):
        self.index = faiss.IndexFlatIP(DIMENSION)
        if self._vectors:
            self.index.add(np.array(self._vectors, dtype=np.float32))

    def _save(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            faiss.write_index(self.index, INDEX_FILE)
            with open(IDS_FILE, "w") as f:
                json.dump({"ids": self.profile_ids, "vectors": self._vectors}, f)
        except Exception as e:
            logger.warning("Failed to persist index: %s", e)

    def _load(self):
        if os.path.exists(INDEX_FILE) and os.path.exists(IDS_FILE):
            try:
                self.index = faiss.read_index(INDEX_FILE)
                with open(IDS_FILE) as f:
                    data = json.load(f)
                self.profile_ids = data.get("ids", [])
                self._vectors = data.get("vectors", [])
                logger.info("Loaded FAISS index from disk: %d profiles", len(self.profile_ids))
            except Exception as e:
                logger.warning("Could not load saved index, starting fresh: %s", e)
                self.index = faiss.IndexFlatIP(DIMENSION)
                self.profile_ids = []
                self._vectors = []

    @property
    def size(self) -> int:
        return self.index.ntotal


# Global singleton — loads from disk on first import
_vector_index = VectorIndex()


def get_index() -> VectorIndex:
    return _vector_index
