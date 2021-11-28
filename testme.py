import salabim as sim
import matplotlib.pyplot as plt
import streamlit as st

speed=3 #m/s

class Car(sim.Component):
    def setup(self,d1,s1,b1,s2):
        self.d1=d1
        self.s1=s1
        self.d2=d2
        self.s1=s1     
    
    def process(self):
        tot_dist=0
        while True:
            
            start_drive=env.now()
            # driving along the road
            yield self.hold(sim.Normal(d1,s1),mode='drive')
            end_drive=env.now()
            dist=(end_drive-start_drive)*speed
            
            tot_dist=tot_dist+dist
            holding.tally(tot_dist)
                                                
            # stop for a coffee
            yield self.hold(sim.Normal(b1,s2),mode='break')
            holding.tally(tot_dist)
            

env=sim.Environment(trace=True)            

# columns
col1, col2 = st.columns([3,1])

# sliders
drive_time=col1.slider('drive time min',30,120)
break_time=col1.slider('break time min',5,30)

standard_dev1=col2.slider('standard deviation min',5,30)
standard_dev2=col2.slider('standard deviation',1,10)

holding=sim.Monitor('holding_time')

Car(drive_time,standard_dev1,break_time,standard_dev2)

if st.button('click to run'):
    env.run(till=100)

tot_dist=holding.xt()

fig,ax=plt.subplots(figsize=(15,5),nrows=1,ncols=1)

ax.plot(tot_dist[1],tot_dist[0],label='distance driven') 

st.write(fig)

