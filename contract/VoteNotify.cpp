#include "VoteNotify.hpp"

#include <algorithm>

#include <eosiolib/print.hpp>


void VoteNotify::notifyall(eosio::name bp, const std::string& positiveMsg,
    const std::string& negativeMsg)
{
    require_auth(bp);
    simple_voters_table bp_voters_old(get_self(), bp.value); //old votes info (from last notify() call)

    std::vector<eosio::name> gone; //voters that has taken their votes off this bp since last notify() call
    std::vector<eosio::name> come; //new voters that put their votes on this bp since last notify() call
    std::vector<eosio::name> bp_voters = collectBpVoters(bp);
    //TODO: optimization - make one cycle instead of two
    //considering table is sorted by primary key
    for (const auto& bp_voter : bp_voters)
    {
        if (bp_voters_old.find(bp_voter.value) == bp_voters_old.end())
        {
            //send Thank you!
            sendNotification(bp_voter, positiveMsg);
            come.push_back(bp_voter);
        }
    }
    for (const auto& bp_voter : bp_voters_old)
    {
        if (std::find(bp_voters.begin(), bp_voters.end(), bp_voter.owner) == bp_voters.end())
        {
            //send something sad :(((
            sendNotification(bp_voter.owner, negativeMsg);
            gone.push_back(bp_voter.owner);
        }
    }

    //updating voters list for this bp
    updateBpVoters(bp, gone, come);
}

void VoteNotify::notifynew(eosio::name bp, const std::string& positiveMsg)
{
    require_auth(bp);
    simple_voters_table bp_voters_old(get_self(), bp.value); //old votes info (from last notify() call)

    std::vector<eosio::name> come; //new voters that put their votes on this bp since last notify() call
    std::vector<eosio::name> bp_voters = collectBpVoters(bp);

    for (const auto& bp_voter : bp_voters)
    {
        if (bp_voters_old.find(bp_voter.value) == bp_voters_old.end())
        {
            //send Thank you!
            sendNotification(bp_voter, positiveMsg);
            come.push_back(bp_voter);
        }
    }
    updateBpVoters(bp, std::vector<eosio::name>(), come);
}

void VoteNotify::notifygone(eosio::name bp, const std::string& negativeMsg)
{
    require_auth(bp);
    simple_voters_table bp_voters_old(get_self(), bp.value); //old votes info (from last notify() call)

    std::vector<eosio::name> gone; //voters that has taken their votes off this bp since last notify() call
    std::vector<eosio::name> bp_voters = collectBpVoters(bp);

    for (const auto& bp_voter : bp_voters_old)
    {
        if (std::find(bp_voters.begin(), bp_voters.end(), bp_voter.owner) == bp_voters.end())
        {
            //send something sad :(((
            sendNotification(bp_voter.owner, negativeMsg);
            gone.push_back(bp_voter.owner);
        }
    }
    updateBpVoters(bp, gone, std::vector<eosio::name>());
}

void VoteNotify::notify(eosio::name user, const std::string& message)
{
    require_auth(get_self());
    require_recipient(user);
}

std::vector<eosio::name> VoteNotify::collectBpVoters(eosio::name bp) const
{
    voters_table voters("eosio"_n, ("eosio"_n).value);
    std::vector<eosio::name> ret;
    for (const auto& voter: voters)
    {
        if (std::find(voter.producers.begin(), voter.producers.end(), bp) != voter.producers.end())
        {
            ret.push_back(voter.owner);
        }
    }
    return ret;
}

void VoteNotify::updateBpVoters(eosio::name bp, const std::vector<eosio::name>& gone,
    const std::vector<eosio::name>& come)
{
    simple_voters_table bp_voters(get_self(), bp.value);
    for (auto voter : gone)
    {
        auto it = bp_voters.find(voter.value);
        bp_voters.erase(it);
    }
    for (auto voter : come)
    {
        bp_voters.emplace(bp, [voter](auto& inserted)
        {
            inserted.owner = voter;
        });
    }
}

void VoteNotify::sendNotification(eosio::name user, const std::string& message) const
{
    print(name{user}, ": ", message);
    action(
        permission_level { get_self(), "active"_n },
        get_self(), "notify"_n,
        std::make_tuple(user, message)
    ).send();
}