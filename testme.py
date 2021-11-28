import salabim as sim
import matplotlib.pyplot as plt
import streamlit as st

speed=3 #m/s

class Car(sim.Component):
    def process(self):
        tot_dist=0
        while True:
            
            start_drive=env.now()
            # driving along the road
            yield self.hold(sim.Normal(6,2),mode='drive')
            end_drive=env.now()
            dist=(end_drive-start_drive)*speed
            
            tot_dist=tot_dist+dist
            holding.tally(tot_dist)
                                                
            # stop for a coffee
            yield self.hold(sim.Normal(10,5),mode='break')
            holding.tally(tot_dist)
            

env=sim.Environment(trace=True)            
Car()

holding=sim.Monitor('holding_time')

if st.button('click to run'):
    env.run(till=100)

tot_dist=holding.xt()

fig,ax=plt.subplots(figsize=(15,5),nrows=1,ncols=1)

ax.plot(tot_dist[1],tot_dist[0],label='distance driven') 

st.write(fig)

