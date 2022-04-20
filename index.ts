

import {Connection, Keypair, PublicKey, 
    sendAndConfirmTransaction, Transaction,
    
     TransactionInstruction , SystemProgram} from '@solana/web3.js';

import { struct, u16, u8} from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
interface TransactionVote {
    id: number,
    sender: PublicKey,
    amount: bigint,
    state: number ,
    address_type: PublicKey,
    votes: number,
   
};

let TransactionVoteLayout = struct<TransactionVote> ([
    u8('id'),
    publicKey('sender'),
    u64('amount'),
    u8('state'),
    publicKey('address_type'),
    u16('votes')
]);


let printVote = (vote: TransactionVote) => {
    console.log("id = " + vote.id);
    console.log("sender = " + vote.sender);
    console.log("amount = " + vote.amount);
    console.log("state = " + vote.state);
    console.log("address type = " + vote.address_type);
    console.log("votes = " + vote.votes);
}


let main = async () => {

    console.log("creating a solana transaction");

    let key = Keypair.fromSecretKey(
        Uint8Array.from(
            [209,86,131,200,103,176,13,5,219,217,169,121,113,175,115,88,189,137,25,213,222,236,127,58,119,102,50,96,118,15,203,189,159,148,62,193,149,21,7,81,130,253,24,164,55,177,41,245,116,32,13,101,196,205,131,236,110,227,36,207,212,222,132,50]
        ));

    let connection = new Connection("http://127.0.0.1:8899");

    let programId = new PublicKey("DVZ4pvaupsYUaDWW9S4Z81pXdqTTQK1gd8gHsECL1pZC");
    
    let transactionVoteData = Keypair.generate();
    let createAccountTransaction = new Transaction();
    let size = TransactionVoteLayout.span;
    let topay = await connection.getMinimumBalanceForRentExemption( size);
    createAccountTransaction.add(
        SystemProgram.createAccount(
            {
                fromPubkey: key.publicKey,
                newAccountPubkey: transactionVoteData.publicKey,
                lamports: topay,
                space: size,
                programId
            }
        )
    );

    console.log("creating new account " + transactionVoteData.publicKey.toBase58());
    let ctx = await sendAndConfirmTransaction(connection ,
        createAccountTransaction,
        [ key,  transactionVoteData  ], {commitment: 'max'}
        );
    
    console.log("dataaccount created " , ctx);
    
    let transaction = new Transaction();

    let vote =  {
         id: 79,
         sender: Keypair.generate().publicKey,
         amount:  BigInt(1500),
         state: 1 ,
         address_type: Keypair.generate().publicKey,
         votes: 10,
    };

    let instruction_Data = Buffer.alloc(TransactionVoteLayout.span + 1);
    TransactionVoteLayout.encode(vote, instruction_Data  , 1);
    instruction_Data[0] = 1;
    printVote(vote);

    transaction.add(
        new TransactionInstruction(
            {
                programId,
                keys: [{pubkey: transactionVoteData.publicKey , 
                       isSigner: false, 
                      isWritable : true}],
                data: instruction_Data

            }
        )
    );

    let tx = await sendAndConfirmTransaction(connection , transaction , [key],  {commitment: 'max'});
    
    console.log(tx);

    let info = await connection.getAccountInfo(transactionVoteData.publicKey);
    if (! info) {
        console.log("no data");
        return;
    }    
    let txVote =     TransactionVoteLayout.decode( Uint8Array.from(  info.data ));

    printVote(txVote);


}


main();