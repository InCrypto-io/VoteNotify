#include <vector>

#include <eosiolib/asset.hpp>
#include <eosiolib/eosio.hpp>

using namespace eosio;


class [[eosio::contract]] VoteNotify : public eosio::contract
{
public:
    using contract::contract;

    [[eosio::action]]
    void notifyall(eosio::name bp, const std::string& positiveMsg,
        const std::string& negativeMsg);

    [[eosio::action]]
    void notifynew(eosio::name bp, const std::string& positiveMsg);

    [[eosio::action]]
    void notifygone(eosio::name bp, const std::string& negativeMsg);

    [[eosio::action]]
    void notify(eosio::name user, const std::string& message);

private:

    std::vector<eosio::name> collectBpVoters(eosio::name bp) const;
    void updateBpVoters(eosio::name bp, const std::vector<eosio::name>& gone,
        const std::vector<eosio::name>& come);
    void sendNotification(eosio::name user, const std::string& message) const;

    struct [[eosio::table, eosio::contract("eosio.system")]] voter_info {
        eosio::name                owner;     /// the voter
        eosio::name                proxy;     /// the proxy set by the voter, if any
        std::vector<eosio::name>   producers; /// the producers approved by this voter if no proxy set
        int64_t             staked = 0;

        /**
        *  Every time a vote is cast we must first "undo" the last vote weight, before casting the
        *  new vote weight.  Vote weight is calculated as:
        *
        *  stated.amount * 2 ^ ( weeks_since_launch/weeks_per_year)
        */
        double              last_vote_weight = 0; /// the vote weight cast the last time the vote was updated

        /**
        * Total vote weight delegated to this voter.
        */
        double              proxied_vote_weight= 0; /// the total vote weight delegated to this voter as a proxy
        bool                is_proxy = 0; /// whether the voter is a proxy for others


        uint32_t            reserved1 = 0;
        uint32_t            reserved2 = 0;
        eosio::asset        reserved3;

        uint64_t primary_key()const { return owner.value; }

        // explicit serialization macro is not necessary, used here only to improve compilation time
        EOSLIB_SERIALIZE( voter_info, (owner)(proxy)(producers)(staked)(last_vote_weight)(proxied_vote_weight)(is_proxy)(reserved1)(reserved2)(reserved3) )
   };

   typedef eosio::multi_index< "voters"_n, voter_info >  voters_table;

    struct [[eosio::table]] voter
    {
        eosio::name owner;

        uint64_t primary_key()const { return owner.value; }

        EOSLIB_SERIALIZE( voter, (owner) )
    };

    typedef eosio::multi_index< "voters"_n, voter>  simple_voters_table;
};

//TODO: check if this needs to be replaced with apply function
//for example to make send responde only to self calls
EOSIO_DISPATCH(VoteNotify, (notifyall)(notify)(notifynew)(notifygone))