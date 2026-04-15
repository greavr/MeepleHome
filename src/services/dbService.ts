import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp, getDocs, getDoc } from 'firebase/firestore';

export const createHome = async (name: string, userId: string) => {
  const homeRef = collection(db, 'homes');
  try {
    const docRef = await addDoc(homeRef, {
      name,
      members: [userId],
      ownerId: userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'homes');
  }
};

export const joinHome = async (homeId: string, userId: string) => {
  const homeRef = doc(db, 'homes', homeId);
  try {
    const snap = await getDoc(homeRef);
    if (!snap.exists()) throw new Error("Home not found");
    const data = snap.data();
    if (!data.members.includes(userId)) {
      await updateDoc(homeRef, {
        members: [...data.members, userId]
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}`);
  }
};

export const addGameToHome = async (homeId: string, gameData: any, userId: string) => {
  const gamesRef = collection(db, 'homes', homeId, 'games');
  try {
    await addDoc(gamesRef, {
      ...gameData,
      homeId,
      addedBy: userId,
      addedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `homes/${homeId}/games`);
  }
};

export const createGameNight = async (homeId: string, date: string) => {
  const nightsRef = collection(db, 'homes', homeId, 'gameNights');
  try {
    await addDoc(nightsRef, {
      homeId,
      date,
      status: 'planned',
      votes: {},
      selectedGameId: null,
      scores: [],
      notes: '',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `homes/${homeId}/gameNights`);
  }
};

export const voteForGame = async (homeId: string, nightId: string, gameId: string, userId: string) => {
  const nightRef = doc(db, 'homes', homeId, 'gameNights', nightId);
  try {
    const snap = await getDoc(nightRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const votes = { ...data.votes };
    
    // Remove user's vote from other games
    Object.keys(votes).forEach(gid => {
      votes[gid] = votes[gid].filter((uid: string) => uid !== userId);
    });
    
    // Add vote to this game
    if (!votes[gameId]) votes[gameId] = [];
    votes[gameId].push(userId);
    
    await updateDoc(nightRef, { votes });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}/gameNights/${nightId}`);
  }
};

export const recordScoresAndNotes = async (homeId: string, nightId: string, scores: any[], notes: string, selectedGameId: string) => {
  const nightRef = doc(db, 'homes', homeId, 'gameNights', nightId);
  try {
    await updateDoc(nightRef, {
      scores,
      notes,
      selectedGameId,
      status: 'completed'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}/gameNights/${nightId}`);
  }
};

export const updateHome = async (homeId: string, data: Partial<{ name: string; ownerId: string }>) => {
  const homeRef = doc(db, 'homes', homeId);
  try {
    await updateDoc(homeRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}`);
  }
};

export const leaveHome = async (homeId: string, userId: string) => {
  const homeRef = doc(db, 'homes', homeId);
  try {
    const snap = await getDoc(homeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const newMembers = data.members.filter((id: string) => id !== userId);
    
    if (newMembers.length === 0) {
      await deleteDoc(homeRef);
    } else {
      const updateData: any = { members: newMembers };
      if (data.ownerId === userId) {
        updateData.ownerId = newMembers[0]; // Transfer ownership if owner leaves
      }
      await updateDoc(homeRef, updateData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}`);
  }
};

export const removeMember = async (homeId: string, memberId: string) => {
  const homeRef = doc(db, 'homes', homeId);
  try {
    const snap = await getDoc(homeRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const newMembers = data.members.filter((id: string) => id !== memberId);
    await updateDoc(homeRef, { members: newMembers });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `homes/${homeId}`);
  }
};

export const deleteHome = async (homeId: string) => {
  const homeRef = doc(db, 'homes', homeId);
  try {
    await deleteDoc(homeRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `homes/${homeId}`);
  }
};

export const addReview = async (gameId: string, userId: string, userName: string, rating: number, comment: string) => {
  const reviewsRef = collection(db, 'reviews');
  try {
    await addDoc(reviewsRef, {
      gameId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
  }
};
