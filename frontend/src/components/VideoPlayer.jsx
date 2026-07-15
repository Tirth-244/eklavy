import React, { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import './VideoPlayer.css'

const VideoPlayer = ({ courseId, lectureId }) => {
  const { user } = useAuth()
  const videoRef = useRef(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToken = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await axiosInstance.post(`/courses/${courseId}/access-token`, { lectureId })
        setToken(data.token)
      } catch (err) {
        setError(err.response?.data?.message || 'Access denied. Purchase this course to view lectures.')
      } finally {
        setLoading(false)
      }
    }
    if (courseId && lectureId) {
      fetchToken()
    }
  }, [courseId, lectureId])

  useEffect(() => {
    if (!token || !videoRef.current) return

    const video = videoRef.current
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    const streamUrl = `${apiBase}/api/stream/${lectureId}/playlist.m3u8?token=${encodeURIComponent(token)}`

    let hls

    if (Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = true
        }
      })
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Fatal HLS error, destroying client')
              setError('Secure playback failed')
              hls.destroy()
              break
          }
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
    } else {
      setError('HLS streaming is not supported on this browser.')
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [token, lectureId])

  if (loading) {
    return (
      <div className="player-placeholder animate-pulse">
        <div className="spinner" />
        <p>Establishing secure connection...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="player-placeholder error-placeholder">
        <p>🔒 {error}</p>
      </div>
    )
  }

  return (
    <div className="secure-video-wrapper" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className="secure-video-element"
      />
      {/* Watermarks */}
      {user?.email && (
        <>
          <div className="video-watermark wm-1">
            <span>{user.email} (eklavya-student)</span>
          </div>
          <div className="video-watermark wm-2">
            <span>{user.email} (eklavya-student)</span>
          </div>
        </>
      )}
    </div>
  )
}

export default VideoPlayer
