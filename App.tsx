import { useEventListener } from 'expo'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect, useState } from 'react'
import { AppState, StyleSheet, Text, View } from 'react-native'

const SOURCE = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

export default function App() {
  const player = useVideoPlayer(SOURCE, (p) => {
    p.loop = true
    p.play()
  })
  const [playing, setPlaying] = useState(false)

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    setPlaying(isPlaying)
    console.log(`[repro] playingChange isPlaying=${isPlaying} appState=${AppState.currentState}`)
  })

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) =>
      console.log(`[repro] appState=${state} isPlaying=${player.playing}`)
    )
    const id = setInterval(
      () => console.log(`[repro] tick appState=${AppState.currentState} isPlaying=${player.playing} t=${player.currentTime.toFixed(1)}`),
      2000
    )
    return () => {
      sub.remove()
      clearInterval(id)
    }
  }, [player])

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        allowsPictureInPicture
        startsPictureInPictureAutomatically={playing}
      />
      <Text style={styles.text}>{playing ? 'playing' : 'paused'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  text: { color: '#fff', textAlign: 'center', marginTop: 16 }
})
